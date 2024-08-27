const Stock = require('../models/stock');
const Customer = require('../models/customer');
const moment = require('moment-timezone');
const { filterLogs } = require('../middleware/logger.js');


// Add or update stock
exports.addStock = async (req, res) => {
  try {
    const { size, weight, boxCount, packageCount, packageContain, notes } = req.body;

    const dateInTurkey = moment.tz("Europe/Istanbul").toDate();
    const total = boxCount * packageCount * packageContain;

    // Find the existing stock entry by uniqueId and size
    let stock = await Stock.findOne({ size, weight });

    if (stock) {
      // Update existing stock by adding the new quantities and recalculating the total
      stock.total += total;
      stock.boxCount += boxCount;
      stock.notes = notes; // Update notes if needed
      stock.date = dateInTurkey;
      
    } else {
      // Create a new stock entry if it doesn't exist
      stock = new Stock({
        size,
        weight,
        total,
        boxCount,
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

exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const stock = await
    Stock.findByIdAndDelete(id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.status(200).json({ message: 'Stock deleted successfully', stock });
  }
  catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ message: 'Error deleting stock', error: error.message });
  }
};


exports.updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, weight, boxCount, total, notes } = req.body;

    const stock = await Stock.findById(id);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    stock.size = size;
    stock.weight = weight;
    stock.total = total;
    stock.boxCount = boxCount;
    stock.notes = notes;

    const updatedStock = await stock.save();

    res.status(200).json({ message: 'Stock updated successfully', stock: updatedStock });
  }
  catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Error updating stock', error: error.message });
  }
};

// Sell stock
exports.sellStock = async (req, res) => {
  try {
    const { size, weight, boxCount, packageCount, packageContain, customerId , notes} = req.body;

    // Find the existing stock entry by uniqueId and size
    let stock = await Stock.findOne({ size, weight });

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Calculate the total items requested to be sold
    const totalBoxRequested = boxCount;
    const totalPackageRequested = packageCount;
    const totalContainRequested = packageContain;
    const totalRequested = totalBoxRequested * totalPackageRequested * totalContainRequested;

    // Check if there is enough stock to sell
    if (stock.total < totalRequested) {
      return res.status(400).json({ message: 'Not enough stock to sell' });
    }

    // Decrease the stock quantities
    stock.total -= totalRequested;
    stock.boxCount -= totalBoxRequested;

    const updatedStock = await stock.save();

    // Find the customer by their ID
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Add the sold stock details to the customer's purchases
    customer.purchases.push({
      size,
      weight,
      boxCount: totalBoxRequested,
      packageCount: totalPackageRequested,
      packageContain: totalContainRequested,
      notes, 
      date: moment.tz("Europe/Istanbul").toDate()
    });

    await customer.save();

    res.status(200).json({ message: 'Stock sold successfully', stock: updatedStock, customer });
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({ message: 'Error selling stock', error: error.message });
  }
};


// Get all active stocks
exports.getAllActiveStock = async (req, res) => {
  try {
    const stocks = await Stock.find().sort({ date: -1 }); // Sort by date, newest first
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error getting stocks:', error);
    res.status(500).json({ message: 'Error getting stocks', error: error.message });
  }
};

// Get all passive stocks
exports.getAllPassiveStock = async (req, res) => {
  try {
    // Find all customers and return their purchases
    const customers = await Customer.find({}, 'purchases'); // Fetch only the 'purchases' field for all customers
    res.status(200).json(customers);
  } catch (error) {
    console.error('Error getting stocks:', error);
    res.status(500).json({ message: 'Error getting stocks', error: error.message });
  }
};


// Get all stocks (active and passive)
exports.getAllStocks = async (req, res) => {
  try {
    // Retrieve all active stocks from the Stock collection
    const activeStocks = await Stock.find().sort({ date: -1 }); // Sort by date, newest first
    
    // Retrieve all passive stocks from the Customer collection
    const customers = await Customer.find({}, 'purchases'); // Fetch only the 'purchases' field
    
    // Extract purchases from all customers
    const passiveStocks = customers.reduce((acc, customer) => acc.concat(customer.purchases), []);

    // Combine active and passive stocks
    const allStocks = {
      active: activeStocks,
      passive: passiveStocks
    };

    res.status(200).json(allStocks);
  } catch (error) {
    console.error('Error getting stocks:', error);
    res.status(500).json({ message: 'Error getting stocks', error: error.message });
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

    res.status(200).json(filteredLogs);
  } catch (error) {
    console.error('Error getting stocks added in period:', error);
    res.status(500).json({ message: 'Error getting stocks added in period', error: error.message });
  }
};



// Get paginated and filtered active stocks
exports.getPaginatedActiveStock = async (req, res) => {
  try {
    const { page = 1, limit = 10, size, weight } = req.query;
    
    const filter = {};
    if (size) filter.size = size;
    if (weight) filter.weight = weight;
    
    const stocks = await Stock.find(filter)
      .sort({ date: -1 }) // Sort by date, newest first
      .skip((page - 1) * limit) // Calculate how many documents to skip
      .limit(parseInt(limit));  // Limit the number of documents

    const totalCount = await Stock.countDocuments(filter);

    res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      stocks
    });
  } catch (error) {
    console.error('Error getting paginated active stocks:', error);
    res.status(500).json({ message: 'Error getting paginated active stocks', error: error.message });
  }
};




// Get paginated and filtered passive stocks
exports.getPaginatedPassiveStock = async (req, res) => {
  try {
    const { page = 1, limit = 10, size, weight } = req.query;

    // Find all customers and retrieve their purchases
    const customers = await Customer.find()
      .select('purchases')
      .lean(); // Fetch only the 'purchases' field

    // Flatten purchases and filter them based on query parameters
    let passiveStocks = customers.reduce((acc, customer) => acc.concat(customer.purchases), []);
    
    if (size) passiveStocks = passiveStocks.filter(purchase => purchase.size === size);
    if (weight) passiveStocks = passiveStocks.filter(purchase => purchase.weight === weight);

    // Pagination
    const totalCount = passiveStocks.length;
    const paginatedStocks = passiveStocks.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      passiveStocks: paginatedStocks
    });
  } catch (error) {
    console.error('Error getting paginated passive stocks:', error);
    res.status(500).json({ message: 'Error getting paginated passive stocks', error: error.message });
  }
};



// Get paginated and filtered all stocks (active and passive)
exports.getPaginatedAllStocks = async (req, res) => {
  try {
    const { page = 1, limit = 10, size, weight } = req.query;

    // Fetch active stocks from the Stock collection
    const filter = {};
    if (size) filter.size = size;
    if (weight) filter.weight = weight;

    const activeStocksQuery = Stock.find(filter)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalActiveCountQuery = Stock.countDocuments(filter);

    // Fetch passive stocks from the Customer collection
    const customers = await Customer.find()
      .select('purchases')
      .lean();

    let passiveStocks = customers.reduce((acc, customer) => acc.concat(customer.purchases), []);

    if (size) passiveStocks = passiveStocks.filter(purchase => purchase.size === size);
    if (weight) passiveStocks = passiveStocks.filter(purchase => purchase.weight === weight);

    // Calculate pagination for passive stocks
    const totalPassiveCount = passiveStocks.length;
    const paginatedPassiveStocks = passiveStocks.slice((page - 1) * limit, page * limit);

    // Combine active and passive stocks
    const [activeStocks, totalActiveCount] = await Promise.all([activeStocksQuery, totalActiveCountQuery]);

    // Combine active and passive stocks and paginate
    const allStocks = [...activeStocks, ...paginatedPassiveStocks];
    const totalCount = totalActiveCount + totalPassiveCount;

    res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
      allStocks
    });
  } catch (error) {
    console.error('Error getting paginated all stocks:', error);
    res.status(500).json({ message: 'Error getting paginated all stocks', error: error.message });
  }
};



exports.searchNotesAllStocks = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;
    
    const paginationOptions = {
      skip: (page - 1) * limit,
      limit: parseInt(limit)
    };

    // Prepare search query for notes
    const searchRegExp = searchQuery ? new RegExp(searchQuery, 'i') : null;

    // Fetch and paginate active stocks
    const activeStocksQuery = Stock.find(searchQuery ? { notes: searchRegExp } : {})
      .sort({ date: -1 })
      .skip(paginationOptions.skip)
      .limit(paginationOptions.limit);
    
    const totalActiveCountQuery = Stock.countDocuments(searchQuery ? { notes: searchRegExp } : {});

    // Fetch all customers and filter their purchases
    const customers = await Customer.find().select('purchases').lean();
    let passiveStocks = customers.reduce((acc, customer) => acc.concat(customer.purchases), []);
    
    if (searchQuery) {
      passiveStocks = passiveStocks.filter(purchase => 
        purchase.notes && searchRegExp.test(purchase.notes)
      );
    }

    // Calculate pagination for passive stocks
    const totalPassiveCount = passiveStocks.length;
    const paginatedPassiveStocks = passiveStocks.slice(paginationOptions.skip, paginationOptions.skip + paginationOptions.limit);

    // Fetch active stocks and total active count
    const [activeStocks, totalActiveCount] = await Promise.all([activeStocksQuery, totalActiveCountQuery]);

    // Combine active and paginated passive stocks
    const allStocks = [...activeStocks, ...paginatedPassiveStocks];
    const totalCount = totalActiveCount + totalPassiveCount;

    res.status(200).json({
      stocks: allStocks,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
      totalItems: totalCount,
    });
  } catch (error) {
    console.error('Error searching stocks by notes:', error);
    res.status(500).json({ message: 'Error searching stocks by notes', error: error.message });
  }
};
// 2. Search for active stocks by notes
exports.searchNotesActiveStocks = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;

    // Create a query for active stocks (those present in the Stock collection)
    const query = {};
    if (searchQuery) {
      query.notes = { $regex: searchQuery, $options: 'i' };
    }

    // Fetch and paginate active stocks
    const stocks = await Stock.find(query)
      .sort({ date: -1 }) // Sort by date, newest first
      .skip((page - 1) * limit) // Calculate how many documents to skip
      .limit(parseInt(limit))  // Limit the number of documents
      .exec();

    // Get the total count of active stocks matching the query
    const count = await Stock.countDocuments(query);

    res.status(200).json({
      stocks,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      totalItems: count,
    });
  } catch (error) {
    console.error('Error searching active stocks by notes:', error);
    res.status(500).json({ message: 'Error searching active stocks by notes', error: error.message });
  }
};

// 3. Search for customer purchases by notes
exports.searchNotesPassiveStocks = async (req, res) => {
  try {
    const { searchQuery, page = 1, limit = 5 } = req.query;

    // Create a query to search for notes in customer purchases
    const query = { "purchases.notes": { $regex: searchQuery, $options: 'i' } };

    // Fetch and paginate customers with matching purchases
    const customers = await Customer.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .select('purchases')  // Only select the 'purchases' field
      .lean(); // Use lean() to get plain JavaScript objects

    // Extract and filter purchases from all customers
    const allPurchases = customers.reduce((acc, customer) => acc.concat(customer.purchases), []);
    const filteredPurchases = allPurchases.filter(purchase =>
      purchase.notes && new RegExp(searchQuery, 'i').test(purchase.notes)
    );

    // Get the total count of filtered purchases
    const totalCount = filteredPurchases.length;

    // Paginate the filtered purchases
    const paginatedPurchases = filteredPurchases.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      purchases: paginatedPurchases,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
      totalItems: totalCount,
    });
  } catch (error) {
    console.error('Error searching customer purchases by notes:', error);
    res.status(500).json({ message: 'Error searching customer purchases by notes', error: error.message });
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