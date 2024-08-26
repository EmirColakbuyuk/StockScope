const Stock = require('../models/stock');
const Customer = require('../models/customer');
const moment = require('moment-timezone');
const { filterLogs } = require('../middleware/logger.js');
const mongoose = require('mongoose');


// Add or update stock
exports.addStock = async (req, res) => {
  try {
    const { size, weight, boxCount, itemsPerBox, itemsPerPackage, notes } = req.body;

    const dateInTurkey = moment.tz("Europe/Istanbul").toDate();

    // Find if the stock already exists with the same properties including weight
    let stock = await Stock.findOne({ size, weight, itemsPerBox, itemsPerPackage });

    if (stock) {
      // Eğer aynı stok zaten varsa, mevcut `boxCount` ile gelen `boxCount`'u topla
      console.log('Existing boxCount:', stock.boxCount); // Mevcut boxCount'u yazdır
      stock.boxCount = Number(stock.boxCount) + Number(boxCount); // Toplama işlemi
      console.log('Updated boxCount:', stock.boxCount); // Güncellenmiş boxCount'u yazdır
      stock.updatedAt = dateInTurkey; // İsteğe bağlı olarak tarihi güncelle
    } else {
      // Eğer stok yoksa yeni bir stok oluştur
      stock = new Stock({
        status: 'active', // Status otomatik olarak "active" olarak ayarlanır
        size,
        weight, // Ağırlık bir kez ayarlanır ve sabit kalır
        boxCount,
        itemsPerBox,
        itemsPerPackage,
        notes,
        date: dateInTurkey,
        createdBy: req.user._id
      });
    }

    const savedStock = await stock.save();

    res.status(201).json({ message: 'Stock added or updated successfully', stock: savedStock });
  } catch (error) {
    console.error('Error adding or updating stock:', error);
    res.status(500).json({ message: 'Error adding or updating stock', error: error.message });
  }
};




// Sell stock
exports.sellStock = async (req, res) => {
  try {
    const { size, boxCount, itemsPerBox, itemsPerPackage, customerId } = req.body;

    // Validate the customerId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }

    let stock = await Stock.findOne({ size, itemsPerBox, itemsPerPackage });

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    if (stock.boxCount < boxCount) {
      return res.status(400).json({ message: 'Not enough stock to sell' });
    }

    stock.boxCount -= boxCount;

    if (stock.boxCount === 0) {
      stock.status = 'passive';
    }

    const updatedStock = await stock.save();

    const passiveStock = new Stock({
      status: 'passive',
      size: stock.size,
      weight: stock.weight,
      boxCount: boxCount,
      itemsPerBox: stock.itemsPerBox,
      itemsPerPackage: stock.itemsPerPackage,
      notes: `Sold to customer ID: ${customerId}`,
      date: moment.tz("Europe/Istanbul").toDate(),
      createdBy: req.user._id
    });

    await passiveStock.save();

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.purchases.push({
      size,
      boxCount,
      itemsPerBox,
      itemsPerPackage,
      date: moment.tz("Europe/Istanbul").toDate()
    });

    await customer.save();

    res.status(200).json({ message: 'Stock sold successfully', stock: updatedStock, customer });
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({ message: 'Error selling stock', error: error.message });
  }
};



// delete stock
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { boxCount } = req.body;

    const stock = await Stock.findById(id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Check if there is enough stock to delete
    if (stock.boxCount < boxCount) {
      return res.status(400).json({ message: 'Not enough stock to delete' });
    }

    // Decrease the original stock box count
    stock.boxCount -= boxCount;

    // If the stock is now empty, delete the stock or mark it as 'passive'
    if (stock.boxCount === 0) {
      await stock.deleteOne();
      return res.status(200).json({ message: 'Stock deleted successfully' });
    } else {
      const updatedStock = await stock.save();
      return res.status(200).json({ message: 'Stock updated successfully', stock: updatedStock });
    }
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ message: 'Error deleting stock', error: error.message });
  }
};

// Update Stock
exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = 'active', size, weight, boxCount, itemsPerBox, itemsPerPackage, notes } = req.body;

    const stock = await Stock.findById(id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Eğer req.body'de status gönderilmediyse, 'active' olarak ayarlanacak
    stock.status = status;
    stock.size = size;
    stock.weight = weight;
    stock.boxCount = boxCount;
    stock.itemsPerBox = itemsPerBox;
    stock.itemsPerPackage = itemsPerPackage;
    stock.notes = notes;

    const updatedStock = await stock.save();

    res.status(200).json({ message: 'Stock updated successfully', stock: updatedStock });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Error updating stock', error: error.message });
  }
};




// Get all stocks
exports.getAllStock = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ date: -1 }); // Sort by date, newest first
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error getting stocks:', error);
    res.status(500).json({ message: 'Error getting stocks', error: error.message });
  }
};

// Get stocks by date
exports.byDateStock = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Date query parameter is required' });
    }

    const startOfDay = moment.tz(date, "Europe/Istanbul").startOf('day').toDate();
    const endOfDay = moment.tz(date, "Europe/Istanbul").endOf('day').toDate();

    const stocks = await Stock.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).sort({ date: -1 }); // Sort by date, newest first

    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error getting stocks by date:', error);
    res.status(500).json({ message: 'Error getting stocks by date', error: error.message });
  }
};

// Get the number of stocks added within a certain period
exports.getStocksAddedInPeriod = (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Convert dates to moment objects
    const start = moment(startDate, 'YYYY-MM-DD').startOf('day');
    const end = moment(endDate, 'YYYY-MM-DD').endOf('day');

    // Validate dates using moment
    if (!start.isValid() || !end.isValid()) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Convert to JavaScript Date objects for comparison
    const startJsDate = start.toDate();
    const endJsDate = end.toDate();

    // Filter logs for stocks added in the specified period
    const logs = filterLogs(null, null); // Modify if you need to filter by other criteria
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return log.method === 'POST' && log.url.includes('/api/addstocks') && logDate >= startJsDate && logDate <= endJsDate;
    });

    // Calculate the total amount of stocks added
    const totalAmount = filteredLogs.reduce((sum, log) => {
      if (log.requestBody && log.requestBody.boxCount && log.requestBody.itemsPerBox && log.requestBody.itemsPerPackage) {
        const boxCount = log.requestBody.boxCount;
        const itemsPerBox = log.requestBody.itemsPerBox;
        const itemsPerPackage = log.requestBody.itemsPerPackage;
        return sum + (boxCount * itemsPerBox * itemsPerPackage);
      }
      return sum;
    }, 0);

    // Return filtered logs and total amount
    res.status(200).json({ logs: filteredLogs, totalAmount });
  } catch (error) {
    console.error('Error getting stocks added in period:', error);
    res.status(500).json({ message: 'Error getting stocks added in period', error: error.message });
  }
};


// Functions

// Get all stocks with pagination, regardless of status
exports.getAllStocksPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const stocks = await Stock.find()
        .sort({ date: -1 })  // Tarihe göre en son eklenenden ilk eklenene doğru sıralama
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const totalItems = await Stock.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      stocks,
      currentPage: Number(page),
      totalPages,
      totalItems,
    });
  } catch (error) {
    console.error('Error getting all stocks:', error);
    res.status(500).json({ message: 'Error getting all stocks', error: error.message });
  }
};

// Get active stocks with pagination
exports.getActiveStocksPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const stocks = await Stock.find({ status: 'active' })
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const totalItems = await Stock.countDocuments({ status: 'active' });
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      stocks,
      currentPage: Number(page),
      totalPages,
      totalItems,
    });
  } catch (error) {
    console.error('Error getting active stocks:', error);
    res.status(500).json({ message: 'Error getting active stocks', error: error.message });
  }
};

// Get passive stocks with pagination
exports.getPassiveStocksPaginated = async (req, res) => {
  try {
    const { page = 1, limit = 5 } = req.query;

    const stocks = await Stock.find({ status: 'passive' })
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const totalItems = await Stock.countDocuments({ status: 'passive' });
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      stocks,
      currentPage: Number(page),
      totalPages,
      totalItems,
    });
  } catch (error) {
    console.error('Error getting passive stocks:', error);
    res.status(500).json({ message: 'Error getting passive stocks', error: error.message });
  }
};

// 1. Tüm durumlar için arama (status fark etmeksizin)
exports.searchNotesAllStocks = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;

    let query = {};
    if (searchQuery) {
      query.notes = { $regex: searchQuery, $options: 'i' };
    }

    const stocks = await Stock.find(query)
        .sort({ date: -1 })  // Tarihe göre en son eklenenden ilk eklenene doğru sıralama
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .exec();

    const count = await Stock.countDocuments(query);

    res.status(200).json({
      stocks,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error searching stocks by notes:', error);
    res.status(500).json({ message: 'Error searching stocks by notes', error: error.message });
  }
};

// 2. Sadece "active" status için arama
exports.searchNotesActiveStocks = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;

    let query = { status: 'active' };
    if (searchQuery) {
      query.notes = { $regex: searchQuery, $options: 'i' };
    }

    const stocks = await Stock.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .exec();

    const count = await Stock.countDocuments(query);

    res.status(200).json({
      stocks,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error searching stocks by notes (active):', error);
    res.status(500).json({ message: 'Error searching stocks by notes (active)', error: error.message });
  }
};

// 3. Sadece "passive" status için arama
exports.searchNotesPassiveStocks = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;

    let query = { status: 'passive' };
    if (searchQuery) {
      query.notes = { $regex: searchQuery, $options: 'i' };
    }

    const stocks = await Stock.find(query)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .exec();

    const count = await Stock.countDocuments(query);

    res.status(200).json({
      stocks,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error searching stocks by notes (passive):', error);
    res.status(500).json({ message: 'Error searching stocks by notes (passive)', error: error.message });
  }
};

// 1. Tüm durumlar için filtreleme (status fark etmeksizin)
exports.filterStocks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      size,
      weightComparison1,
      weightValue1,
      weightComparison2,
      weightValue2,
      boxCountComparison1,
      boxCountValue1,
      boxCountComparison2,
      boxCountValue2,
      itemsPerBoxComparison1,
      itemsPerBoxValue1,
      itemsPerBoxComparison2,
      itemsPerBoxValue2,
      itemsPerPackageComparison1,
      itemsPerPackageValue1,
      itemsPerPackageComparison2,
      itemsPerPackageValue2,
      dateBefore,
      dateAfter,
      dateExact,
      passiveDateBefore,
      passiveDateAfter,
      passiveDateExact
    } = req.query;

    let filterCriteria = {};

    if (size) filterCriteria.size = size;

    if (weightValue1 && weightComparison1) {
      filterCriteria.weight = { ...filterCriteria.weight, [`$${weightComparison1}`]: weightValue1 };
    }
    if (weightValue2 && weightComparison2) {
      filterCriteria.weight = { ...filterCriteria.weight, [`$${weightComparison2}`]: weightValue2 };
    }
    if (boxCountValue1 && boxCountComparison1) {
      filterCriteria.boxCount = { ...filterCriteria.boxCount, [`$${boxCountComparison1}`]: boxCountValue1 };
    }
    if (boxCountValue2 && boxCountComparison2) {
      filterCriteria.boxCount = { ...filterCriteria.boxCount, [`$${boxCountComparison2}`]: boxCountValue2 };
    }
    if (itemsPerBoxValue1 && itemsPerBoxComparison1) {
      filterCriteria.itemsPerBox = { ...filterCriteria.itemsPerBox, [`$${itemsPerBoxComparison1}`]: itemsPerBoxValue1 };
    }
    if (itemsPerBoxValue2 && itemsPerBoxComparison2) {
      filterCriteria.itemsPerBox = { ...filterCriteria.itemsPerBox, [`$${itemsPerBoxComparison2}`]: itemsPerBoxValue2 };
    }
    if (itemsPerPackageValue1 && itemsPerPackageComparison1) {
      filterCriteria.itemsPerPackage = { ...filterCriteria.itemsPerPackage, [`$${itemsPerPackageComparison1}`]: itemsPerPackageValue1 };
    }
    if (itemsPerPackageValue2 && itemsPerPackageComparison2) {
      filterCriteria.itemsPerPackage = { ...filterCriteria.itemsPerPackage, [`$${itemsPerPackageComparison2}`]: itemsPerPackageValue2 };
    }

    if (dateBefore) {
      filterCriteria.date = { ...filterCriteria.date, $lt: new Date(dateBefore) };
    }
    if (dateAfter) {
      filterCriteria.date = { ...filterCriteria.date, $gt: new Date(dateAfter) };
    }
    if (dateExact) {
      const exactDate = new Date(dateExact);
      filterCriteria.date = { ...filterCriteria.date, $gte: exactDate, $lt: new Date(exactDate.getTime() + 24 * 60 * 60 * 1000) };
    }

    if (passiveDateBefore) {
      filterCriteria.updatedAt = { ...filterCriteria.updatedAt, $lt: new Date(passiveDateBefore) };
    }
    if (passiveDateAfter) {
      filterCriteria.updatedAt = { ...filterCriteria.updatedAt, $gt: new Date(passiveDateAfter) };
    }
    if (passiveDateExact) {
      const exactDate = new Date(passiveDateExact);
      filterCriteria.updatedAt = { ...filterCriteria.updatedAt, $gte: exactDate, $lt: new Date(exactDate.getTime() + 24 * 60 * 60 * 1000) };
    }

    // Filtrelenmiş sonuçları getir
    const stocks = await Stock.find(filterCriteria)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .exec();

    // Toplam filtrelenmiş sonuçları say
    // const count = await Stock.countDocuments(filterCriteria);
    const count = stocks.length;

    res.status(200).json({
      stocks,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error filtering stocks:', error);
    res.status(500).json({ message: 'Error filtering stocks', error: error.message });
  }
};




// 2. Sadece "active" status için filtreleme (stoğa giriş tarihi baz alınacak)
exports.filterActiveStocks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      size,
      weightComparison1,
      weightValue1,
      weightComparison2,
      weightValue2,
      boxCountComparison1,
      boxCountValue1,
      boxCountComparison2,
      boxCountValue2,
      itemsPerBoxComparison1,
      itemsPerBoxValue1,
      itemsPerBoxComparison2,
      itemsPerBoxValue2,
      itemsPerPackageComparison1,
      itemsPerPackageValue1,
      itemsPerPackageComparison2,
      itemsPerPackageValue2,
      dateBefore,        // Stoğa giriş tarihi için
      dateAfter,         // Stoğa giriş tarihi için
      dateExact          // Stoğa giriş tarihi için
    } = req.query;

    let filterCriteria = { status: 'active' };

    if (size) filterCriteria.size = size;

    // Comparison criteria for weight, boxCount, itemsPerBox, itemsPerPackage
    if (weightValue1 && weightComparison1) {
      filterCriteria.weight = { ...filterCriteria.weight, [`$${weightComparison1}`]: weightValue1 };
    }
    if (weightValue2 && weightComparison2) {
      filterCriteria.weight = { ...filterCriteria.weight, [`$${weightComparison2}`]: weightValue2 };
    }
    if (boxCountValue1 && boxCountComparison1) {
      filterCriteria.boxCount = { ...filterCriteria.boxCount, [`$${boxCountComparison1}`]: boxCountValue1 };
    }
    if (boxCountValue2 && boxCountComparison2) {
      filterCriteria.boxCount = { ...filterCriteria.boxCount, [`$${boxCountComparison2}`]: boxCountValue2 };
    }
    if (itemsPerBoxValue1 && itemsPerBoxComparison1) {
      filterCriteria.itemsPerBox = { ...filterCriteria.itemsPerBox, [`$${itemsPerBoxComparison1}`]: itemsPerBoxValue1 };
    }
    if (itemsPerBoxValue2 && itemsPerBoxComparison2) {
      filterCriteria.itemsPerBox = { ...filterCriteria.itemsPerBox, [`$${itemsPerBoxComparison2}`]: itemsPerBoxValue2 };
    }
    if (itemsPerPackageValue1 && itemsPerPackageComparison1) {
      filterCriteria.itemsPerPackage = { ...filterCriteria.itemsPerPackage, [`$${itemsPerPackageComparison1}`]: itemsPerPackageValue1 };
    }
    if (itemsPerPackageValue2 && itemsPerPackageComparison2) {
      filterCriteria.itemsPerPackage = { ...filterCriteria.itemsPerPackage, [`$${itemsPerPackageComparison2}`]: itemsPerPackageValue2 };
    }

    // Date filters for stoğa giriş (date)
    if (dateBefore) {
      filterCriteria.date = { ...filterCriteria.date, $lt: new Date(dateBefore) };
    }
    if (dateAfter) {
      filterCriteria.date = { ...filterCriteria.date, $gt: new Date(dateAfter) };
    }
    if (dateExact) {
      const exactDate = new Date(dateExact);
      filterCriteria.date = { ...filterCriteria.date, $gte: exactDate, $lt: new Date(exactDate.getTime() + 24 * 60 * 60 * 1000) };
    }

    const stocks = await Stock.find(filterCriteria)
        .sort({ date: -1 })  // Tarihe göre sıralama
        .limit(Number(limit))
        .skip((page - 1) * limit)
        .exec();

    // const count = await Stock.countDocuments(filterCriteria);
    const count = stocks.length;

    res.status(200).json({
      stocks,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error filtering active stocks:', error);
    res.status(500).json({ message: 'Error filtering active stocks', error: error.message });
  }
};

// 3. Sadece "passive" status için filtreleme (stoktan çıkış tarihi baz alınacak)
exports.filterPassiveStocks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      size,
      weightComparison1,
      weightValue1,
      weightComparison2,
      weightValue2,
      boxCountComparison1,
      boxCountValue1,
      boxCountComparison2,
      boxCountValue2,
      itemsPerBoxComparison1,
      itemsPerBoxValue1,
      itemsPerBoxComparison2,
      itemsPerBoxValue2,
      itemsPerPackageComparison1,
      itemsPerPackageValue1,
      itemsPerPackageComparison2,
      itemsPerPackageValue2,
      passiveDateBefore, // Stoktan çıkış tarihi için
      passiveDateAfter,  // Stoktan çıkış tarihi için
      passiveDateExact   // Stoktan çıkış tarihi için
    } = req.query;

    let filterCriteria = { status: 'passive' };

    if (size) filterCriteria.size = size;

    // Comparison criteria for weight, boxCount, itemsPerBox, itemsPerPackage
    if (weightValue1 && weightComparison1) {
      filterCriteria.weight = { ...filterCriteria.weight, [`$${weightComparison1}`]: weightValue1 };
    }
    if (weightValue2 && weightComparison2) {
      filterCriteria.weight = { ...filterCriteria.weight, [`$${weightComparison2}`]: weightValue2 };
    }
    if (boxCountValue1 && boxCountComparison1) {
      filterCriteria.boxCount = { ...filterCriteria.boxCount, [`$${boxCountComparison1}`]: boxCountValue1 };
    }
    if (boxCountValue2 && boxCountComparison2) {
      filterCriteria.boxCount = { ...filterCriteria.boxCount, [`$${boxCountComparison2}`]: boxCountValue2 };
    }
    if (itemsPerBoxValue1 && itemsPerBoxComparison1) {
      filterCriteria.itemsPerBox = { ...filterCriteria.itemsPerBox, [`$${itemsPerBoxComparison1}`]: itemsPerBoxValue1 };
    }
    if (itemsPerBoxValue2 && itemsPerBoxComparison2) {
      filterCriteria.itemsPerBox = { ...filterCriteria.itemsPerBox, [`$${itemsPerBoxComparison2}`]: itemsPerBoxValue2 };
    }
    if (itemsPerPackageValue1 && itemsPerPackageComparison1) {
      filterCriteria.itemsPerPackage = { ...filterCriteria.itemsPerPackage, [`$${itemsPerPackageComparison1}`]: itemsPerPackageValue1 };
    }
    if (itemsPerPackageValue2 && itemsPerPackageComparison2) {
      filterCriteria.itemsPerPackage = { ...filterCriteria.itemsPerPackage, [`$${itemsPerPackageComparison2}`]: itemsPerPackageValue2 };
    }

    // Date filters for stoktan çıkış (updatedAt)
    if (passiveDateBefore) {
      filterCriteria.updatedAt = { ...filterCriteria.updatedAt, $lt: new Date(passiveDateBefore) };
    }
    if (passiveDateAfter) {
      filterCriteria.updatedAt = { ...filterCriteria.updatedAt, $gt: new Date(passiveDateAfter) };
    }
    if (passiveDateExact) {
      const exactDate = new Date(passiveDateExact);
      filterCriteria.updatedAt = { ...filterCriteria.updatedAt, $gte: exactDate, $lt: new Date(exactDate.getTime() + 24 * 60 * 60 * 1000) };
    }

    const stocks = await Stock.find(filterCriteria)
        .sort({ updatedAt: -1 })  // Stoktan çıkış tarihine göre sıralama
        .limit(Number(limit))
        .skip((page - 1) * limit)
        .exec();

    // const count = await Stock.countDocuments(filterCriteria);
    const count = stocks.length;

    res.status(200).json({
      stocks,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error filtering passive stocks:', error);
    res.status(500).json({ message: 'Error filtering passive stocks', error: error.message });
  }
};