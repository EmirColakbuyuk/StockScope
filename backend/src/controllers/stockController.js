const Stock = require('../models/stock');
const Customer = require('../models/customer');
const moment = require('moment-timezone');
const { filterLogs } = require('../middleware/logger.js');

const mongoose = require('mongoose');


exports.addStock = async (req, res) => {
  try {
    const { size, weight, boxCount, packageCount, packageContain, notes } = req.body;
    console.log(req.body);

    // Gelen verileri sayısal değerlere dönüştürün
    const numericWeight = parseFloat(weight);
    const numericBoxCount = parseInt(boxCount, 10);
    const numericPackageCount = parseInt(packageCount, 10);
    const numericPackageContain = parseInt(packageContain, 10);

    const dateInTurkey = moment.tz("Europe/Istanbul").toDate();
    const total = numericBoxCount * numericPackageCount * numericPackageContain;

    let stock = await Stock.findOne({ size, weight: numericWeight });

    if (stock) {
      stock.total += total;
      stock.boxCount += numericBoxCount;
      stock.notes = notes;
    } else {
      

      stock = new Stock({
        size,
        weight: numericWeight,
        total,
        boxCount: numericBoxCount,
        notes,
        createdBy: req.user._id
      });

      console.log('New Stock Created:', stock);
    }
    const savedStock = await stock.save();
    
    res.status(201).json({ message: 'Stock added or updated successfully', stock: savedStock });
  } catch (error) {
    
    res.status(500).json({ message: 'Error adding or updating stock', error: error.message });
  }
};

// Delete Stock
exports.deleteStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { boxCount, totalCount } = req.body; // totalCount here represents the amount to delete

    const stock = await Stock.findById(id);

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    // Check if there’s enough stock to delete
    if (stock.boxCount < boxCount) {
      return res.status(400).json({ message: 'Not enough stock to delete' });
    }

    // Update the stock quantities
    stock.boxCount -= boxCount;
    stock.total -= totalCount;

    // If all stock is deleted, remove the stock entry completely
    if (stock.boxCount === 0 && stock.total === 0) {
      await Stock.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Stock fully deleted', totalDeleted: totalCount });
    }

    // Save the updated stock entry
    await stock.save();

    res.status(200).json({ message: 'Stock updated successfully', totalDeleted: totalCount, stock });
  } catch (error) {
    console.error('Error deleting stock:', error);
    res.status(500).json({ message: 'Error deleting stock', error: error.message });
  }
};


exports.deleteStockFromCustomer = async (req, res) => {
  try {
    const { customerId, purchaseId, restock } = req.body;


    // Find the customer by ID
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Find the corresponding purchase entry
    const purchase = customer.purchases.id(purchaseId);
    if (!purchase) {
      return res.status(404).json({ message: 'Purchase not found' });
    }

    // Calculate the total items: package count * package contain
    const totalItems = purchase.boxCount * purchase.packageCount * purchase.packageContain;

    let stock;

    // If restock is true, restore stock back to the database
    if (restock === true) {
      // Check for existing stock by size and weight
      stock = await Stock.findOne({ size: purchase.size, weight: purchase.weight });

      if (stock) {
        // If stock exists, update the quantities
        stock.total += totalItems;
        stock.boxCount += purchase.boxCount;
      } else {
        // If stock does not exist, create a new stock entry
        stock = new Stock({
          size: purchase.size,
          weight: purchase.weight,
          boxCount: purchase.boxCount,
          total: totalItems,
          createdBy: req.user._id, // Information about who created the stock
          notes: purchase.notes || '', // Notes from the purchase (if any)
          date: null
        });
      }

      // Save the updated or new stock
      await stock.save();
    }

    // Remove the purchase entry from the customer's purchases
    customer.purchases.pull(purchaseId);

    // Save the updated customer information
    await customer.save();

    res.status(200).json({ message: `Stock ${restock ? 'restored' : 'deleted'} successfully from customer`, stock, customer });
  } catch (error) {
    console.error('Error deleting stock from customer:', error);
    res.status(500).json({ message: 'Error deleting stock from customer', error: error.message });
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


// Sell Stock
exports.sellStock = async (req, res) => {
  try {
    console.log('Gelen veriler (req.body):', req.body);

    const { size, weight, boxCount, packageCount, packageContain, customerId, notes, soldNote } = req.body; 

    // Find the existing stock entry by size and weight
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

    // Find the customer by their ID
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Add the sold stock details to the customer's purchases with soldNote
    customer.purchases.push({
      size,
      weight,
      boxCount: totalBoxRequested,
      packageCount: totalPackageRequested,
      packageContain: totalContainRequested,
      notes,
      soldNote, 
      date: moment.tz("Europe/Istanbul").toDate()
    });

    await customer.save();

    // Check if stock needs to be deleted
    if (stock.total <= 0 || stock.boxCount <= 0) {
      await Stock.findByIdAndDelete(stock._id);
      return res.status(200).json({ message: 'Stock sold successfully and stock deleted due to zero quantity', amountSold: totalRequested, soldNote, customer });
    }

    const updatedStock = await stock.save();

    res.status(200).json({ message: 'Stock sold successfully', amountSold: totalRequested, soldNote, stock: updatedStock, customer });
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


// Get distinct values by field
exports.getDistinctValuesByField = async (req, res) => {
  try {
    const { field } = req.params;

    // List of fields to check if field is valid
    const validFields = ['size', 'weight'];

    // Check if the provided field is valid
    if (!validFields.includes(field)) {
      return res.status(400).json({ message: 'Invalid field name' });
    }

    // Get distinct values for the specified field
    const distinctValues = await Stock.distinct(field);

    res.status(200).json({ [field]: distinctValues });
  } catch (error) {
    console.error('Error getting distinct values by field:', error);
    res.status(500).json({ message: 'Error getting distinct values by field', error: error.message });
  }
};


// Get all distinct sizes
exports.getAllSizes = async (req, res) => {
  try {
    const sizes = await Stock.distinct('size');
    res.status(200).json(sizes);
  } catch (error) {
    console.error('Error getting sizes:', error);
    res.status(500).json({ message: 'Error getting sizes', error: error.message });
  }
};


// Get distinct weights by size
exports.getDistinctWeightsBySize = async (req, res) => {
  try {
    const { size } = req.params;

    // Fetch distinct weights for the given size
    const distinctWeights = await Stock.distinct('weight', { size });

    res.status(200).json({ size, weights: distinctWeights });
  } catch (error) {
    console.error('Error getting distinct weights by size:', error);
    res.status(500).json({ message: 'Error getting distinct weights by size', error: error.message });
  }
};




// Get paginated and filtered active stocks
exports.getPaginatedActiveStock = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;  // Sayıya çevir
    const limit = parseInt(req.query.limit) || 10;  // Sayıya çevir
    const { size, weight } = req.query;  // Filtreler

    const filter = {};  // Boş bir filtre nesnesi oluştur
    if (size) filter.size = size;  // Eğer size varsa filtreye ekle
    if (weight) filter.weight = weight;  // Eğer weight varsa filtreye ekle

    // Stokları filtreleyip, sıralayıp, sayfalama işlemi yapıyoruz
    const stocks = await Stock.find(filter)
        .sort({ createdAt: -1 })  // Tarihe göre ters sırala (en yeni ilk sırada)
        .skip((page - 1) * limit)  // Sayfaya göre kaç tane belge atlanacak
        .limit(limit);  // Kaç tane belge alınacak

    // Toplam stok sayısını buluyoruz (filtreli)
    const totalCount = await Stock.countDocuments(filter);

    res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),  // Toplam sayfa sayısı
      currentPage: page,  // Şu anki sayfa
      totalItems: totalCount,  // Toplam stok sayısı (totalItems ekliyoruz)
      stocks  // Filtrelenmiş stokları döndürüyoruz
    });
  } catch (error) {
    console.error('Error getting paginated active stocks:', error);
    res.status(500).json({ message: 'Error getting paginated active stocks', error: error.message });
  }
};


//
exports.getPaginatedPassiveStock = async (req, res) => {
  try {
    const { page = 1, limit = 5, size, weight, boxCount, packageCount, packageContain, date } = req.query;

    // Find all customers and retrieve their purchases
    const customers = await Customer.find().lean(); // Fetch entire customers including purchases

    // Flatten purchases and include customerId with each purchase
    let passiveStocks = customers.reduce((acc, customer) => {
      const purchasesWithCustomerId = customer.purchases.map(purchase => ({
        ...purchase,
        customerId: customer._id  // Add customerId to each purchase
      }));
      return acc.concat(purchasesWithCustomerId);
    }, []);

    // Apply filters
    if (size) passiveStocks = passiveStocks.filter(purchase => purchase.size === size);
    if (weight) passiveStocks = passiveStocks.filter(purchase => purchase.weight === Number(weight));
    if (boxCount) passiveStocks = passiveStocks.filter(purchase => purchase.boxCount === Number(boxCount));
    if (packageCount) passiveStocks = passiveStocks.filter(purchase => purchase.packageCount === Number(packageCount));
    if (packageContain) passiveStocks = passiveStocks.filter(purchase => purchase.packageContain === Number(packageContain));
    if (date) passiveStocks = passiveStocks.filter(purchase => new Date(purchase.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]);

    passiveStocks = passiveStocks.sort((a, b) => new Date(b.date) - new Date(a.date));


    // Calculate total for each purchase
    passiveStocks = passiveStocks.map(purchase => ({
      ...purchase,
      total: purchase.boxCount * purchase.packageCount * purchase.packageContain
    }));

    // Pagination (Apply pagination AFTER filtering)
    const totalCount = passiveStocks.length;
    const paginatedStocks = passiveStocks.slice((page - 1) * limit, page * limit);

    // Return paginated result
    res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),  // Calculate total pages
      currentPage: Number(page),
      totalItems: totalCount,  // The total number of items after filtering
      passiveStocks: paginatedStocks  // The paginated results
    });
  } catch (error) {
    console.error('Error getting paginated passive stocks:', error);
    res.status(500).json({ message: 'Error getting paginated passive stocks', error: error.message });
  }
};



exports.getPaginatedAllStocks = async (req, res) => {
  try {
    const { page = 1, limit = 5, size, weight } = req.query;

    // Aktif stoklar için filtre
    const filter = {};
    if (size) filter.size = size;
    if (weight) filter.weight = weight;

    // Aktif stokları al
    const activeStocks = await Stock.find(filter)
        .sort({ date: -1 });

    const totalActiveCount = await Stock.countDocuments(filter);

    // Pasif stokları al
    const customers = await Customer.find()
        .select('purchases')
        .lean();

    // en son eklendi
    // Pasif stoklara `customerId` ekleyin
    let passiveStocks = customers.reduce((acc, customer) => {
      // Müşteri verisi içerisindeki `purchases` alanına `customerId` ekleyerek her `purchase` için güncelleme yapıyoruz
      const purchasesWithCustomerId = customer.purchases.map(purchase => ({
        ...purchase,
        customerId: customer._id,  // `customerId`'yi ekleyin
        purchaseId: purchase._id
      }));
      return acc.concat(purchasesWithCustomerId);  // Güncellenmiş `purchase` verisini `acc` dizisine ekle
    }, []);


    // let passiveStocks = customers.reduce((acc, customer) => acc.concat(customer.purchases), []);

    // Filtreleri pasif stoklara uygula
    if (size) passiveStocks = passiveStocks.filter(purchase => purchase.size === size);
    if (weight) passiveStocks = passiveStocks.filter(purchase => purchase.weight === weight);

    // Toplam değer için pasif stokları güncelle
    passiveStocks = passiveStocks.map(purchase => ({
      ...purchase,
      total: purchase.boxCount * purchase.packageCount * purchase.packageContain,
      date: purchase.date ? new Date(purchase.date) : 'Invalid Date'  // Pasif stoklar için tarih sorununu düzelt
    }));

    // Aktif ve Pasif stokları birleştir ve tarihe göre sırala
    const combinedStocks = [...activeStocks, ...passiveStocks].sort((a, b) => new Date(b.date) - new Date(a.date));

    // Toplam stok sayısını al
    const totalCount = combinedStocks.length;

    // Paginasyonu uygula (birleştirilmiş stoklardan sadece sayfada göstermek istediğin sayıda al)
    const paginatedStocks = combinedStocks.slice((page - 1) * limit, page * limit);

    res.status(200).json({
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
      allStocks: paginatedStocks,
      totalItems: totalCount,  // Toplam stok sayısı
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

    // Fetch active stocks and total active count
    const [activeStocks, totalActiveCount] = await Promise.all([activeStocksQuery, totalActiveCountQuery]);

    // Passive stock pagination based on remaining slots after active stocks
    const remainingLimit = limit - activeStocks.length;
    const paginatedPassiveStocks = passiveStocks.slice(0, remainingLimit); // Only get remaining slots for passive stocks

    // Combine active and passive stocks
    const allStocks = [...activeStocks, ...paginatedPassiveStocks];

    // Total number of stocks for pagination
    const totalCount = totalActiveCount + passiveStocks.length;

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



// FILTER



exports.filterAllStocks = async (req, res) => {
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
      totalComparison1,
      totalValue1,
      totalComparison2,
      totalValue2,
      dateBefore,
      dateAfter,
      dateExact, // Applied only to active stocks (createdAt)
      passiveDateBefore,
      passiveDateAfter,
      passiveDateExact, // Applied only to passive stocks (date)
      customer,
    } = req.query;

    const comparisonOperators = {
      'gt': '$gt',
      'lt': '$lt',
      'eq': '$eq',
      'gte': '$gte',
      'lte': '$lte'
    };

    let filterCriteria = {}; // For active stocks (with createdAt field)
    let passiveFilterCriteria = {}; // For sold stocks (purchases)

    // Helper function to apply comparison filters
    const addComparisonFilter = (field, comparison1, value1, comparison2, value2, filterObj) => {
      const filter = {};
      if (comparison1 === 'between' && value1 && value2) {
        filter.$gte = parseFloat(value1);
        filter.$lte = parseFloat(value2);
      } else {
        if (value1 && comparison1) filter[comparisonOperators[comparison1]] = parseFloat(value1);
        if (value2 && comparison2) filter[comparisonOperators[comparison2]] = parseFloat(value2);
      }
      if (Object.keys(filter).length > 0) filterObj[field] = filter;
    };

    // Size filter (applies to both active and passive)
    if (size) {
      filterCriteria.size = size;
      passiveFilterCriteria['purchases.size'] = size;
    }

    // Apply comparison filters for weight, boxCount, total (both active and passive)
    addComparisonFilter('weight', weightComparison1, weightValue1, weightComparison2, weightValue2, filterCriteria);
    addComparisonFilter('boxCount', boxCountComparison1, boxCountValue1, boxCountComparison2, boxCountValue2, filterCriteria);
    addComparisonFilter('total', totalComparison1, totalValue1, totalComparison2, totalValue2, filterCriteria);

    // Date filtering for active stocks (createdAt field)
    if (dateExact || dateBefore || dateAfter) {
      // If any active date filters are applied, ensure only active stocks are fetched
      if (dateExact) {
        const exactDate = new Date(dateExact);
        filterCriteria.createdAt = {
          $gte: new Date(exactDate.setHours(0, 0, 0, 0)),
          $lt: new Date(exactDate.setHours(23, 59, 59, 999))
        };
      } else {
        if (dateBefore) {
          const beforeDate = new Date(dateBefore).setHours(23, 59, 59, 999);
          filterCriteria.createdAt = { ...filterCriteria.createdAt, $lte: beforeDate };
        }
        if (dateAfter) {
          const afterDate = new Date(dateAfter).setHours(0, 0, 0, 0); // Start of the day for "after"
          filterCriteria.createdAt = { ...filterCriteria.createdAt, $gte: afterDate };
        }
      }

      // Since we're filtering by active stock dates (createdAt), passive stocks should be excluded
      passiveFilterCriteria = {}; // Ensure no passive stocks are included
    }

    // Define startOfDay and endOfDay for passive date filtering
    let startOfDay, endOfDay;

    // Date filtering for passive (sold) stocks (date field)
    if (passiveDateExact || passiveDateBefore || passiveDateAfter) {
      if (passiveDateExact) {
        const exactPassiveDate = new Date(passiveDateExact);
        startOfDay = new Date(exactPassiveDate.setHours(0, 0, 0, 0));
        endOfDay = new Date(exactPassiveDate.setHours(23, 59, 59, 999));

        passiveFilterCriteria['purchases.date'] = {
          $gte: startOfDay,
          $lt: endOfDay
        };
      } else {
        if (passiveDateBefore) {
          // Set time to the end of the day (23:59:59.999) to include the entire day
          const beforePassiveDate = new Date(passiveDateBefore).setHours(23, 59, 59, 999);
          passiveFilterCriteria['purchases.date'] = { ...passiveFilterCriteria['purchases.date'], $lte: beforePassiveDate };
        }
        if (passiveDateAfter) {
          // Set time to the start of the day (00:00:00.000) to include the entire day for "after"
          const afterPassiveDate = new Date(passiveDateAfter).setHours(0, 0, 0, 0);
          passiveFilterCriteria['purchases.date'] = { ...passiveFilterCriteria['purchases.date'], $gte: afterPassiveDate };
        }
      }
    }


    let activeStocks = [];
    let totalActiveCount = 0;

    // Fetch active stocks only if no passive-specific filters are applied
    if (!customer && !passiveDateBefore && !passiveDateAfter && !passiveDateExact) {
      activeStocks = await Stock.find(filterCriteria)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));
      totalActiveCount = await Stock.countDocuments(filterCriteria);
    }

    // Fetch passive stocks only if customer filters or passive-specific date filters are applied
    let customerFilter = {}; // Customer-specific filters for passive stocks
    if (customer) customerFilter._id = customer; // Use 'customer' instead of 'customerId'

    const customers = await Customer.find(customerFilter).select('purchases').lean();

    let passiveStocks = customers.reduce((acc, customer) => {
      const filteredPurchases = customer.purchases.filter(purchase => {
        let matches = true;

        // Apply size and comparison filters for sold stocks
        if (size) matches = matches && (purchase.size === size);
        matches = matches && checkComparison(purchase.weight, weightComparison1, weightValue1, weightComparison2, weightValue2);
        matches = matches && checkComparison(purchase.boxCount, boxCountComparison1, boxCountValue1, boxCountComparison2, boxCountValue2);

        // Apply passive date filtering
        if (passiveDateExact || passiveDateBefore || passiveDateAfter) {
          const purchaseDate = new Date(purchase.date);
          if (passiveDateExact) {
            matches = matches && (purchaseDate >= startOfDay && purchaseDate < endOfDay);
          } else {
            if (passiveDateBefore) matches = matches && purchaseDate <= new Date(passiveDateBefore);
            if (passiveDateAfter) matches = matches && purchaseDate >= new Date(passiveDateAfter);
          }
        }

        return matches;
      });

      return acc.concat(filteredPurchases.map(purchase => ({
        ...purchase,
        customerId: customer._id // Add customer ID to sold stock
      })));
    }, []);

    const totalPassiveCount = passiveStocks.length;
    const paginatedPassiveStocks = passiveStocks.slice((page - 1) * limit, page * limit);

    // Combine active and passive stocks (only passive if customer filters applied)
    const allStocks = (!dateExact && !dateBefore && !dateAfter) ? [...activeStocks, ...paginatedPassiveStocks] : activeStocks;

    const totalCount = (!dateExact && !dateBefore && !dateAfter) ? totalActiveCount + totalPassiveCount : totalActiveCount;

    res.status(200).json({
      allStocks,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
      totalItems: totalCount
    });
  } catch (error) {
    console.error('Error filtering all stocks:', error);
    res.status(500).json({ message: 'Error filtering all stocks', error: error.message });
  }
};

// Define the checkComparison helper function
const checkComparison = (value, comparison1, value1, comparison2, value2) => {
  const applyComparison = (v, c, t) => {
    if (c === 'gt') return v > t;
    if (c === 'lt') return v < t;
    if (c === 'eq') return v === t;
    if (c === 'gte') return v >= t;
    if (c === 'lte') return v <= t;
    if (c === 'between') return v >= value1 && v <= value2; // Apply "between" logic
    return true; // If no valid comparison, don't filter
  };

  let matches = true;
  if (comparison1 && value1) matches = matches && applyComparison(value, comparison1, parseFloat(value1));
  if (comparison2 && value2 && comparison1 !== 'between') matches = matches && applyComparison(value, comparison2, parseFloat(value2)); 
  return matches;
};



// 1. Sadece aktif stoklar için filtreleme
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
      totalComparison1,
      totalValue1,
      totalComparison2,
      totalValue2,
      dateBefore,
      dateAfter,
      dateExact
    } = req.query;

    let filterCriteria = {};  // Filtre kriterlerini burada tutacağız.

    // Boyut (size) filtresi
    if (size) filterCriteria.size = size;

    // Yardımcı fonksiyon: Sayısal filtreleri uygular (arasında veya karşılaştırmalar)
    const addComparisonFilter = (field, comparison1, value1, comparison2, value2) => {
      const filter = {};
      if (comparison1 === 'between' && value1 && value2) {
        filter.$gte = parseFloat(value1);
        filter.$lte = parseFloat(value2);
      } else {
        if (value1 && comparison1) filter[`$${comparison1}`] = parseFloat(value1);
        if (value2 && comparison2) filter[`$${comparison2}`] = parseFloat(value2);
      }
      if (Object.keys(filter).length > 0) filterCriteria[field] = filter;
    };

    // Ağırlık (weight) için filtreler
    addComparisonFilter('weight', weightComparison1, weightValue1, weightComparison2, weightValue2);

    // Kutu Sayısı (boxCount) için filtreler
    addComparisonFilter('boxCount', boxCountComparison1, boxCountValue1, boxCountComparison2, boxCountValue2);

    // Toplam (total) için filtreler
    addComparisonFilter('total', totalComparison1, totalValue1, totalComparison2, totalValue2);

    // Stoğa giriş tarihleri için filtreler (tarih aralığı veya tam tarih)
    if (dateExact) {
      const exactDate = new Date(dateExact);
      // O günün 00:00:00 ile 23:59:59 arası olan verileri filtrele
      filterCriteria.createdAt = {
        $gte: new Date(exactDate.setHours(0, 0, 0, 0)),  // Günü başlat
        $lt: new Date(exactDate.setHours(23, 59, 59, 999))  // Günü bitir
      };
    } else {
      if (dateBefore && dateAfter) {
        const afterDate = new Date(dateAfter);   // Başlangıç tarihi
        const beforeDate = new Date(dateBefore); // Bitiş tarihi

        // Başlangıç gününü 00:00:00 olarak ayarla
        afterDate.setHours(0, 0, 0, 0);
        // Bitiş gününü 23:59:59 olarak ayarla
        beforeDate.setHours(23, 59, 59, 999);

        // Başlangıç ve bitiş tarihleri arasındaki verileri getir
        filterCriteria.createdAt = {
          $gte: afterDate,
          $lte: beforeDate  // 17'si dahil olacak şekilde
        };
      } else if (dateBefore) {
        const beforeDate = new Date(dateBefore);
        beforeDate.setHours(23, 59, 59, 999);  // Bitiş tarihini 23:59:59 olarak ayarla
        filterCriteria.createdAt = { $lte: beforeDate };
      } else if (dateAfter) {
        const afterDate = new Date(dateAfter);
        afterDate.setHours(0, 0, 0, 0);  // Başlangıç tarihini 00:00:00 olarak ayarla
        filterCriteria.createdAt = { $gte: afterDate };
      }
    }



    // Veritabanı sorgusu ve sonuçlar
    const stocks = await Stock.find(filterCriteria)
        .sort({ date: -1 })  // Tarihe göre sıralama (son eklenenler önce)
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const count = await Stock.countDocuments(filterCriteria);

    // Sonuçları JSON formatında geri gönder
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


exports.filterPassiveStocks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      size,
      weightComparison1,
      weightValue1,
      weightValue2,
      boxCountComparison1,
      boxCountValue1,
      boxCountValue2,
      packageCountComparison1,
      packageCountValue1,
      packageCountValue2,
      packageContainComparison1,
      packageContainValue1,
      packageContainValue2,
      passiveDateBefore,
      passiveDateAfter,
      passiveDateExact,
      customer
    } = req.query;

    let customerFilter = {};

    // Müşteriye göre filtreleme (ID)
    if (customer) {
      customerFilter._id = customer;
    }

    // Müşteri verilerini al
    const customers = await Customer.find(customerFilter)
      .select('purchases')
      .lean();

    let passiveStocks = [];
    customers.forEach(customerData => {
      if (Array.isArray(customerData.purchases)) {
        passiveStocks = passiveStocks.concat(
          customerData.purchases.map(purchase => ({
            ...purchase,
            customerId: customerData._id // customerId ekleniyor
          }))
        );
      }
    });

    // Yardımcı Fonksiyon: Karşılaştırma uygula
    const applyComparison = (value, comparison, target) => {
      if (value === undefined || value === null) return false;
      switch (comparison) {
        case 'eq':
          return value === target;
        case 'gt':
          return value > target;
        case 'gte':
          return value >= target;
        case 'lt':
          return value < target;
        case 'lte':
          return value <= target;
        default:
          return false; // Geçerli bir karşılaştırma yoksa false döndür
      }
    };

    // Yardımcı Fonksiyon: Aralık filtrelemesi
    const applyRangeFilter = (stocks, field, value1, value2, comparison1) => {
      if (value1 && value2) {
        return stocks.filter(
          purchase =>
            purchase[field] >= parseFloat(value1) &&
            purchase[field] <= parseFloat(value2)
        );
      } else if (value1 && comparison1) {
        return stocks.filter(purchase =>
          applyComparison(purchase[field], comparison1, parseFloat(value1))
        );
      } else {
        return stocks;
      }
    };

    // Boyut (size) filtrelemesi
    if (size) {
      passiveStocks = passiveStocks.filter(purchase => purchase.size === size);
    }

    // Ağırlık (weight) filtrelemesi (aralık veya karşılaştırma)
    passiveStocks = applyRangeFilter(
      passiveStocks,
      'weight',
      weightValue1,
      weightValue2,
      weightComparison1
    );

    // Kutu sayısı (boxCount) filtrelemesi (aralık veya karşılaştırma)
    passiveStocks = applyRangeFilter(
      passiveStocks,
      'boxCount',
      boxCountValue1,
      boxCountValue2,
      boxCountComparison1
    );

    // Paket sayısı (packageCount) filtrelemesi (aralık veya karşılaştırma)
    passiveStocks = applyRangeFilter(
      passiveStocks,
      'packageCount',
      packageCountValue1,
      packageCountValue2,
      packageCountComparison1
    );

    // Paket içeriği (packageContain) filtrelemesi (aralık veya karşılaştırma)
    passiveStocks = applyRangeFilter(
      passiveStocks,
      'packageContain',
      packageContainValue1,
      packageContainValue2,
      packageContainComparison1
    );

    // Tarih filtrelemesi (passiveDate)
    if (passiveDateExact) {
      const exactPassiveDate = new Date(passiveDateExact);
      passiveStocks = passiveStocks.filter(purchase => {
        const purchaseDate = new Date(purchase.date);
        return (
          purchaseDate >= new Date(exactPassiveDate.setHours(0, 0, 0, 0)) &&
          purchaseDate < new Date(exactPassiveDate.setHours(23, 59, 59, 999))
        );
      });
    } else {
      if (passiveDateBefore && passiveDateAfter) {
        const afterPassiveDate = new Date(passiveDateAfter).setHours(0, 0, 0, 0);
        const beforePassiveDate = new Date(passiveDateBefore).setHours(23, 59, 59, 999);
        passiveStocks = passiveStocks.filter(purchase => {
          const purchaseDate = new Date(purchase.date);
          return purchaseDate >= afterPassiveDate && purchaseDate <= beforePassiveDate;
        });
      } else if (passiveDateBefore) {
        const beforePassiveDate = new Date(passiveDateBefore).setHours(23, 59, 59, 999);
        passiveStocks = passiveStocks.filter(
          purchase => new Date(purchase.date) <= beforePassiveDate
        );
      } else if (passiveDateAfter) {
        const afterPassiveDate = new Date(passiveDateAfter).setHours(0, 0, 0, 0);
        passiveStocks = passiveStocks.filter(
          purchase => new Date(purchase.date) >= afterPassiveDate
        );
      }
    }

    // Pagination
    const totalCount = passiveStocks.length;
    const paginatedPassiveStocks = passiveStocks.slice(
      (page - 1) * limit,
      page * limit
    );

    res.status(200).json({
      passiveStocks: paginatedPassiveStocks,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: Number(page),
      totalItems: totalCount
    });
  } catch (error) {
    console.error('Error filtering passive stocks:', error);
    res.status(500).json({ message: 'Error filtering passive stocks', error: error.message });
  }
};

// ANALYZES

// Helper function to handle date filtering based on filterPeriod or custom date range
// const getDateFilter = (filterPeriod, startDate, endDate) => {
//   const now = new Date();
//   let startDateFilter;
//
//   switch (filterPeriod) {
//     case 'daily':
//       startDateFilter = new Date(now.setHours(0, 0, 0, 0));
//       break;
//     case 'weekly':
//       startDateFilter = new Date(now.setDate(now.getDate() - 7));
//       startDateFilter.setHours(0, 0, 0, 0);
//       break;
//     case 'monthly':
//       startDateFilter = new Date(now.setMonth(now.getMonth() - 1));
//       startDateFilter.setHours(0, 0, 0, 0);
//       break;
//     case '6months':
//       startDateFilter = new Date(now.setMonth(now.getMonth() - 6));
//       startDateFilter.setHours(0, 0, 0, 0);
//       break;
//     case 'yearly':
//       startDateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
//       startDateFilter.setHours(0, 0, 0, 0);
//       break;
//     default:
//       startDateFilter = startDate ? new Date(startDate) : null;
//   }
//
//   const dateFilter = {};
//   if (startDateFilter) dateFilter.$gte = startDateFilter;
//   if (endDate) dateFilter.$lte = new Date(endDate);
//
//   return dateFilter;
// };

// calısan 2
// const getDateFilter = (filterPeriod, startDate, endDate) => {
//   const now = new Date();
//   let startDateFilter;
//
//   switch (filterPeriod) {
//     case 'daily':
//       // Bir önceki günün 00:00'ı
//       startDateFilter = new Date(now);
//       startDateFilter.setDate(now.getDate() - 1);
//       startDateFilter.setHours(0, 0, 0, 0);
//       break;
//     case 'weekly':
//       // Bu haftanın pazartesi günü 00:00'ı
//       const dayOfWeek = now.getDay(); // 0 (Pazar) ile 6 (Cumartesi) arasında
//       const daysSinceMonday = (dayOfWeek + 6) % 7; // Pazartesi için gereken fark
//       startDateFilter = new Date(now);
//       startDateFilter.setDate(now.getDate() - daysSinceMonday);
//       startDateFilter.setHours(0, 0, 0, 0);
//       break;
//     case 'monthly':
//       // Bu ayın başı (ayın 1'i, saat 00:00)
//       startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
//       break;
//     case 'yearly':
//       // Bu yılın başı (1 Ocak, saat 00:00)
//       startDateFilter = new Date(now.getFullYear(), 0, 1);
//       break;
//     case 'allTime':
//       // İlk baştan beri için herhangi bir tarih filtresi yok
//       startDateFilter = null;
//       break;
//     case 'dateRange':
//       // Belirli bir tarih aralığı varsa, başlangıç ve bitiş tarihlerini ayarlayın
//       return { $gte: new Date(startDate), $lte: new Date(endDate) };
//     default:
//       startDateFilter = startDate ? new Date(startDate) : null;
//   }
//
//   const dateFilter = {};
//   if (startDateFilter) dateFilter.$gte = startDateFilter;
//   if (endDate) dateFilter.$lte = new Date(endDate);
//
//   return dateFilter;
// };

// getDateFilter fonksiyonu
const getDateFilter = (filterPeriod, startDate, endDate) => {
  const now = new Date();
  let startDateFilter;

  switch (filterPeriod) {
    case 'daily':
      startDateFilter = new Date(now);
      startDateFilter.setHours(0, 0, 0, 1); // Gecenin başlangıcı
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      const daysSinceMonday = (dayOfWeek + 6) % 7;
      startDateFilter = new Date(now);
      startDateFilter.setDate(now.getDate() - daysSinceMonday);
      startDateFilter.setHours(0, 0, 0, 1); // Haftanın başı
      break;
    case 'monthly':
      startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 1); // Ayın başı
      break;
    case 'yearly':
      startDateFilter = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 1); // Yılın başı
      break;
    case 'allTime':
      startDateFilter = null; // Herhangi bir başlangıç yok
      break;
    case 'dateRange':
      return {
        $gte: new Date(startDate), // String olarak gelen tarih, Date nesnesine çevriliyor
        $lte: new Date(endDate)    // String olarak gelen tarih, Date nesnesine çevriliyor
      };
    default:
      startDateFilter = startDate ? new Date(startDate) : null;
  }

  const dateFilter = {};
  if (startDateFilter) dateFilter.$gte = startDateFilter;
  if (endDate) dateFilter.$lte = new Date(endDate);

  return dateFilter;
};

// Get Active Stock Distribution with Date Filtering
exports.getActiveStockDistribution = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filterPeriod, startDate, endDate);

    // Build match criteria
    const matchCriteria = { date: null };
    if (Object.keys(dateFilter).length > 0) {
      matchCriteria.createdAt = dateFilter;
    }

    // Fetch all active stocks with the provided criteria
    const activeStocks = await Stock.aggregate([
      { $match: matchCriteria }, // Filter for active stocks and date range
      {
        $group: {
          _id: '$size', // Group by size
          totalAmount: { $sum: '$total' }, // Sum the total for each size
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          size: '$_id', // Rename _id to size
          totalAmount: 1,
        },
      },
    ]);

    res.status(200).json(activeStocks);
  } catch (error) {
    console.error('Error fetching active stock distribution:', error);
    res.status(500).json({ error: 'An error occurred while fetching active stock distribution data.' });
  }
};

// Get Passive Stock Distribution with Date Filtering
exports.getPassiveStockDistribution = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filterPeriod, startDate, endDate);

    // Build match criteria
    const matchCriteria = { date: { $ne: null } };
    if (Object.keys(dateFilter).length > 0) {
      matchCriteria.createdAt = dateFilter;
    }

    // Fetch all passive stocks with the provided criteria
    const passiveStocks = await Stock.aggregate([
      { $match: matchCriteria }, // Filter for passive stocks and date range
      {
        $group: {
          _id: '$size', // Group by size
          totalAmount: { $sum: '$total' }, // Sum the total for each size
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          size: '$_id', // Rename _id to size
          totalAmount: 1,
        },
      },
    ]);

    res.status(200).json(passiveStocks);
  } catch (error) {
    console.error('Error fetching passive stock distribution:', error);
    res.status(500).json({ error: 'An error occurred while fetching passive stock distribution data.' });
  }
};

// Get Stock Distribution with Sales Ratio and Date Filtering
exports.getStockDistributionWithSalesRatio = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filterPeriod, startDate, endDate);

    // Build match criteria for active stocks
    const activeMatchCriteria = { date: null };
    if (Object.keys(dateFilter).length > 0) {
      activeMatchCriteria.createdAt = dateFilter;
    }

    // Aggregate active stocks based on size (Active = Unsold stocks)
    const activeStockDistribution = await Stock.aggregate([
      { $match: activeMatchCriteria }, // Filter active stocks and date range
      {
        $group: {
          _id: '$size', // Group by size
          totalAmount: { $sum: '$total' }, // Sum the total for each size
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          size: '$_id', // Rename _id to size
          totalAmount: 1,
        },
      },
    ]);

    // Build match criteria for passive stocks
    const passiveMatchCriteria = { date: { $ne: null } };
    if (Object.keys(dateFilter).length > 0) {
      passiveMatchCriteria.createdAt = dateFilter;
    }

    // Aggregate passive stocks based on size (Passive = Sold stocks)
    const passiveStockDistribution = await Stock.aggregate([
      { $match: passiveMatchCriteria }, // Filter passive stocks and date range
      {
        $group: {
          _id: '$size', // Group by size
          totalAmount: { $sum: '$total' }, // Sum the total for each size
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          size: '$_id', // Rename _id to size
          totalAmount: 1,
        },
      },
    ]);

    // Create a map of passive stock quantities by size for easy lookup
    const passiveStockMap = passiveStockDistribution.reduce((acc, stock) => {
      acc[stock.size] = stock.totalAmount;
      return acc;
    }, {});

    // Calculate the Stock-to-Sales Ratio for each size
    const stockToSalesRatio = activeStockDistribution.map((activeStock) => {
      const size = activeStock.size;
      const activeAmount = activeStock.totalAmount;
      const soldAmount = passiveStockMap[size] || 0; // If no sold amount found, set to 0
      const ratio = soldAmount === 0 ? 0 : (activeAmount / soldAmount).toFixed(2); // Calculate ratio, handle divide by zero

      return {
        size,
        activeAmount,
        soldAmount,
        stockToSalesRatio: ratio,
      };
    });

    // Send the combined data back to the client
    res.status(200).json({
      activeStockDistribution,
      passiveStockDistribution,
      stockToSalesRatio,
    });
  } catch (error) {
    console.error('Error fetching stock distribution with sales ratio:', error);
    res.status(500).json({ error: 'An error occurred while fetching stock distribution with sales ratio.' });
  }
};


// Get Stock In and Out Analysis (Daily, Weekly, Monthly, Yearly)
// exports.getStockInOutAnalysis = async (req, res) => {
//   try {
//     const { filterPeriod, startDate, endDate } = req.query;
//     const dateFilter = getDateFilter(filterPeriod, startDate, endDate);
//
//     // Build match criteria for stock in and stock out using the createdAt and date fields
//     const stockInCriteria = {};
//     const stockOutCriteria = {};
//
//     if (Object.keys(dateFilter).length > 0) {
//       stockInCriteria.createdAt = dateFilter; // Filter for stock added to inventory (createdAt)
//       stockOutCriteria.date = dateFilter;     // Filter for stock removed from inventory (date)
//     }
//
//     // Aggregate stock data to calculate stock in based on createdAt
//     const stockIn = await Stock.aggregate([
//       { $match: { ...stockInCriteria } }, // Match criteria for stock added to inventory
//       {
//         $group: {
//           _id: null, // No grouping by any specific field, we want total sum
//           totalInAmount: { $sum: '$total' }, // Sum of total stock amount added
//           totalInBoxCount: { $sum: '$boxCount' }, // Sum of box count (boxCount instead of koliCount)
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           totalInAmount: 1,
//           totalInBoxCount: 1,
//         },
//       },
//     ]);
//
//     // Aggregate stock data to calculate stock out based on date
//     const stockOut = await Stock.aggregate([
//       { $match: { ...stockOutCriteria, date: { $ne: null } } }, // Match criteria for stock removed from inventory
//       {
//         $group: {
//           _id: null,
//           totalOutAmount: { $sum: '$total' }, // Sum of total stock amount removed
//           totalOutBoxCount: { $sum: '$boxCount' }, // Sum of box count (boxCount instead of koliCount)
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           totalOutAmount: 1,
//           totalOutBoxCount: 1,
//         },
//       },
//     ]);
//
//     // Return the result with total stock in and out amounts
//     res.status(200).json({
//       totalIn: stockIn.length > 0 ? stockIn[0] : { totalInAmount: 0, totalInBoxCount: 0 },
//       totalOut: stockOut.length > 0 ? stockOut[0] : { totalOutAmount: 0, totalOutBoxCount: 0 },
//     });
//   } catch (error) {
//     console.error('Error fetching stock in and out analysis:', error);
//     res.status(500).json({ error: 'An error occurred while fetching stock in and out analysis.' });
//   }
// };
// Get Stock In and Out Analysis with Remaining Calculation (Daily, Weekly, Monthly, Yearly, Custom Date Range)





exports.getStockInOutAnalysis = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filterPeriod, startDate, endDate);

    console.log("Date Filter:", dateFilter);

    console.log("Date Filter:", dateFilter);

    // Stock giriş (Stock modelindeki `createdAt` tarihine göre)
    const stockInCriteria = {};
    if (Object.keys(dateFilter).length > 0) {
      stockInCriteria.createdAt = dateFilter;
    }

    const stockIn = await Stock.aggregate([
      { $match: stockInCriteria },
      {
        $group: {
          _id: null,
          totalInAmount: { $sum: '$total' },
          totalInBoxCount: { $sum: '$boxCount' }
        },
      },
      {
        $project: {
          _id: 0,
          totalInAmount: 1,
          totalInBoxCount: 1
        },
      }
    ]);

    console.log("Stock In Result:", stockIn);

    // Stock çıkışı (Customer modelindeki purchases alanına göre)
    const purchasesCriteria = {};
    if (Object.keys(dateFilter).length > 0) {
      purchasesCriteria['purchases.date'] = dateFilter;
    }

    const stockOut = await Customer.aggregate([
      { $unwind: '$purchases' }, // purchases alanını açmak için
      { $match: purchasesCriteria },
      {
        $group: {
          _id: null,
          totalOutAmount: {
            $sum: {
              $multiply: [
                '$purchases.packageCount',
                '$purchases.boxCount',
                '$purchases.packageContain'
              ]
            }
          },
          totalOutBoxCount: { $sum: '$purchases.boxCount' }
        },
      },
      {
        $project: {
          _id: 0,
          totalOutAmount: 1,
          totalOutBoxCount: 1
        },
      }
    ]);

    console.log("Stock Out Result:", stockOut);


    // totalInAmount değerine totalOutAmount'u ekle
    const totalIn = stockIn.length > 0 ? stockIn[0].totalInAmount : 0;
    const totalOut = stockOut.length > 0 ? stockOut[0].totalOutAmount : 0;
    const adjustedTotalIn = totalIn + totalOut; // stockIn miktarını güncelle

    // Geriye kalan stok miktarını hesapla
    const remainingAmount = adjustedTotalIn - totalOut;

    console.log("Final Result:", {
      adjustedTotalIn: adjustedTotalIn, // Güncellenmiş toplam giriş miktarı
      totalIn: stockIn.length > 0 ? stockIn[0] : { totalInAmount: 0, totalInBoxCount: 0 },
      totalOut: stockOut.length > 0 ? stockOut[0] : { totalOutAmount: 0, totalOutBoxCount: 0 },
      remainingAmount: remainingAmount, // Kalan miktar
    });


    res.status(200).json({
      totalIn: stockIn.length > 0 ? { totalInAmount: adjustedTotalIn, totalInBoxCount: stockIn[0].totalInBoxCount } : { totalInAmount: 0, totalInBoxCount: 0 },
      totalOut: stockOut.length > 0 ? stockOut[0] : { totalOutAmount: 0, totalOutBoxCount: 0 },
      remainingAmount,
    });
  } catch (error) {
    console.error('Error fetching stock in and out analysis:', error);
    res.status(500).json({ error: 'An error occurred while fetching stock in and out analysis.' });
  }
};



// Get Active Stock Distribution with Weight Details
// exports.getActiveStockDistributionWithWeightDetails = async (req, res) => {
//   try {
//     const { filterPeriod, startDate, endDate } = req.query;
//     const dateFilter = getDateFilter(filterPeriod, startDate, endDate);
//
//     const matchCriteria = { date: null };
//     if (Object.keys(dateFilter).length > 0) {
//       matchCriteria.createdAt = dateFilter;
//     }
//
//     const activeStocks = await Stock.aggregate([
//       { $match: matchCriteria },
//       {
//         $group: {
//           _id: { size: '$size', weight: '$weight' }, // Boyut ve gramajlarına göre gruplama
//           totalAmount: { $sum: '$total' }, // Her boyut ve gramajın toplamı
//         },
//       },
//       {
//         $group: {
//           _id: '$_id.size', // Boyutlara göre ana gruplama
//           weights: {
//             $push: {
//               weight: '$_id.weight', // Gramajı sakla
//               amount: '$totalAmount', // Adetleri sakla
//             },
//           },
//           totalSizeAmount: { $sum: '$totalAmount' }, // Boyutun toplam adedi
//         },
//       },
//       {
//         $project: {
//           _id: 0,
//           size: '$_id', // Boyut
//           weights: 1, // Gramaj ve adet bilgisi
//           totalSizeAmount: 1, // Toplam boyut adedi
//         },
//       },
//     ]);
//
//     res.status(200).json(activeStocks);
//   } catch (error) {
//     console.error('Error fetching active stock distribution with weight details:', error);
//     res.status(500).json({ error: 'An error occurred while fetching active stock distribution with weight details.' });
//   }
// };

// Get Active Stock Distribution with Weight and Box Count Details
exports.getActiveStockDistributionWithWeightDetails = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filterPeriod, startDate, endDate);

    const matchCriteria = { date: null };
    if (Object.keys(dateFilter).length > 0) {
      matchCriteria.createdAt = dateFilter;
    }

    const activeStocks = await Stock.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: { size: '$size', weight: '$weight' }, // Boyut ve gramajlarına göre gruplama
          totalAmount: { $sum: '$total' }, // Her boyut ve gramajın toplamı
          totalBoxCount: { $sum: '$boxCount' } // Her boyut ve gramaj için koli sayısının toplamı
        },
      },
      {
        $group: {
          _id: '$_id.size', // Boyutlara göre ana gruplama
          weights: {
            $push: {
              weight: '$_id.weight', // Gramajı sakla
              amount: '$totalAmount', // Adetleri sakla
              boxCount: '$totalBoxCount' // Koli sayısını sakla
            },
          },
          totalSizeAmount: { $sum: '$totalAmount' }, // Boyutun toplam adedi
        },
      },
      {
        $project: {
          _id: 0,
          size: '$_id', // Boyut
          weights: 1, // Gramaj, adet ve koli bilgisi
          totalSizeAmount: 1, // Toplam boyut adedi
        },
      },
    ]);

    res.status(200).json(activeStocks);
  } catch (error) {
    console.error('Error fetching active stock distribution with weight and box count details:', error);
    res.status(500).json({ error: 'An error occurred while fetching active stock distribution with weight and box count details.' });
  }
};
