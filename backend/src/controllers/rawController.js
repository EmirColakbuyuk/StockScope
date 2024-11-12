const RawMaterial = require('../models/raw');
const Supplier = require('../models/supplier');
const Customer = require('../models/customer');
const moment = require('moment-timezone');
const { logger } = require('../middleware/logger');
const Log = require('../models/log'); // Log modelini içeri aktarın
const raw = require('../models/raw');



exports.addRawMaterial = async (req, res) => {
    try {
        const {
            name,
            supplier: supplierCode, 
            type,
            grammage,
            meter,
            bobinWeight,
            bobinNumber,
            bobinHeight,
            bobinDiameter,
            notes
        } = req.body;

        
        const supplierDoc = await Supplier.findOne({ code: supplierCode });
        if (!supplierDoc) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        
        const SquareMeter = bobinHeight * meter;
        const totalBobinweight = bobinWeight * bobinNumber;

        
        const newRawMaterial = new RawMaterial({
            name,
            supplier: supplierCode, 
            type,
            grammage,
            meter,
            bobinWeight,
            bobinNumber,
            bobinHeight,
            bobinDiameter,
            SquareMeter, 
            totalBobinweight, 
            notes,
            createdBy: req.user ? req.user._id : null
        });

        
        const savedRawMaterial = await newRawMaterial.save();

        res.status(201).json({ rawMaterial: savedRawMaterial });
    } catch (error) {
        console.error('Error adding raw material:', error);
        res.status(500).json({ message: 'Error adding raw material', error: error.message });
    }
};


exports.updateRawMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            status,
            supplier: supplierCode, 
            type,
            grammage,
            meter,
            bobinWeight,
            bobinNumber,
            bobinHeight,
            bobinDiameter,
            notes,
            date
        } = req.body;

        // Find supplier by code
        const supplierDoc = await Supplier.findOne({ code: supplierCode });
        if (!supplierDoc) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const SquareMeter = bobinHeight * meter;
        const totalBobinweight = bobinWeight * bobinNumber;

        const dateInTurkey = date ? moment.tz(date, "Europe/Istanbul").toDate() : moment.tz("Europe/Istanbul").toDate();

        const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(
            id,
            {
                name,
                status,
                supplier: supplierCode, 
                type,
                grammage,
                meter,
                bobinWeight,
                bobinNumber,
                bobinHeight,
                bobinDiameter,
                SquareMeter, 
                totalBobinweight, 
                notes,
                updatedAt: dateInTurkey, 
                updatedBy: req.user._id 
            },
            { new: true } 
        );

        if (!updatedRawMaterial) {
            return res.status(404).json({ message: 'Raw material not found' });
        }

        res.status(200).json({ message: 'Raw material updated successfully', rawMaterial: updatedRawMaterial });
    } catch (error) {
        console.error('Error updating raw material:', error);
        res.status(500).json({ message: 'Error updating raw material', error: error.message });
    }
};


// Delete a raw material by ID
exports.deleteRawMaterial = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedRawMaterial = await RawMaterial.findByIdAndDelete(id);

        if (!deletedRawMaterial) {
            return res.status(404).json({message: 'Raw material not found'});
        }
        return res.status(200).json({message: 'Raw material deleted successfully', rawMaterial: deletedRawMaterial});
    } catch (error) {
        console.error('Error deleting raw material:', error);
        res.status(500).json({message: 'Error deleting raw material', error: error.message});
    }
};


// Soft delete a raw material by ID (change status to 'passive' and add soldNote)
exports.softDeleteRawMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { soldNote } = req.body; 

        const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(
            id,
            {
                status: 'passive',
                soldAt: new Date(),
                soldNote 
            },
            { new: true }
        );

        if (!updatedRawMaterial) {
            return res.status(404).json({ message: 'Raw material not found' });
        }

        res.status(200).json({ message: 'Raw material status updated to passive', rawMaterial: updatedRawMaterial });
    } catch (error) {
        console.error('Error updating raw material status:', error);
        res.status(500).json({ message: 'Error updating raw material status', error: error.message });
    }
};

// Soft activate a raw material by ID (change status to 'active' and remove 'soldAt' and 'soldNote')
exports.softActiveRawMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedRawMaterial = await RawMaterial.findByIdAndUpdate(
            id,
            {
                status: 'active',
                $unset: { soldAt: "", soldNote: "" } 
            },
            { new: true }
        );

        if (!updatedRawMaterial) {
            return res.status(404).json({ message: 'Raw material not found' });
        }

        res.status(200).json({ message: 'Raw material status updated to active', rawMaterial: updatedRawMaterial });
    } catch (error) {
        console.error('Error updating raw material status:', error);
        res.status(500).json({ message: 'Error updating raw material status', error: error.message });
    }
};


// Sell raw material to customer
exports.TransferRawMaterial = async (req, res) => {
    try {
        console.log("Request Parameters:", req.params);
        console.log("Request Body:", req.body);
        const { id } = req.params;
        const { customerId, soldNote } = req.body;  

        const rawMaterial = await RawMaterial.findById(id);
        if (!rawMaterial) {
            return res.status(404).json({ message: 'Raw material not found' });
        }

        const saleDate = new Date();

        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }

            customer.purchasesRaw.push({
                name: rawMaterial.name,
                supplier: rawMaterial.supplier,
                type: rawMaterial.type,
                grammage: rawMaterial.grammage,
                meter: rawMaterial.meter,
                bobinWeight: rawMaterial.bobinWeight,
                bobinNumber: rawMaterial.bobinNumber,
                bobinHeight: rawMaterial.bobinHeight,
                bobinDiameter: rawMaterial.bobinDiameter,
                SquareMeter: rawMaterial.SquareMeter,
                totalBobinweight: rawMaterial.totalBobinweight,
                notes: rawMaterial.notes,
                soldNote, 
                date: saleDate 
            });

            
            await customer.save();
        }

        
        rawMaterial.status = 'passive';
        rawMaterial.soldAt = saleDate;
        rawMaterial.soldNote = soldNote; 
        rawMaterial.customer = customerId;


        const updatedRawMaterial = await rawMaterial.save();

        res.status(200).json({
            message: `Raw material ${customerId ? 'transferred to customer and marked' : 'marked'} as passive`,
            rawMaterial: updatedRawMaterial
        });
    } catch (error) {
        console.error('Error  transferring raw material:', error);
        res.status(500).json({ message: 'Error  transferring raw material', error: error.message });
    }
};


// Revert transfer of raw material from customer
exports.revertTransferRawMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { customerId } = req.body;

        const rawMaterial = await RawMaterial.findById(id);
        if (!rawMaterial) {
            return res.status(404).json({ message: 'Raw material not found' });
        }

        if (rawMaterial.status !== 'passive') {
            return res.status(400).json({ message: 'Raw material is not in passive state' });
        }

        if (customerId) {
            const customer = await Customer.findById(customerId);
            if (!customer) {
                return res.status(404).json({ message: 'Customer not found' });
            }

            const purchaseIndex = customer.purchasesRaw.findIndex(purchase => 
                purchase.name === rawMaterial.name &&
                purchase.supplier === rawMaterial.supplier &&
                purchase.type === rawMaterial.type &&
                purchase.date.getTime() === rawMaterial.soldAt.getTime() 
            );

            if (purchaseIndex === -1) {
                return res.status(404).json({ message: 'Purchase record not found in customer data' });
            }

            customer.purchasesRaw.splice(purchaseIndex, 1);
            await customer.save();
        }

        // Revert raw material status to active and remove `soldAt`, `soldNote`, and `customer`
        await RawMaterial.findByIdAndUpdate(
            id,
            {
                status: 'active',
                $unset: { soldAt: "", soldNote: ""},
                customer: null
            },
            { new: true }
        );

        res.status(200).json({
            message: `Raw material ${customerId ? 'removed from customer and ' : ''}reverted to active status`,
            rawMaterial
        });
    } catch (error) {
        console.error('Error reverting transfer of raw material:', error);
        res.status(500).json({ message: 'Error reverting transfer of raw material', error: error.message });
    }
};



// Get all raw materials
exports.getAllRawMaterials = async (req, res) => {
    try {
        const rawMaterials = await RawMaterial.find()
            .sort({createdAt: -1}) // Tarihe göre azalan sıralama
            .populate({
                path: 'supplier',
                select: 'code'
            })
            .populate({
                path: 'type',
                select: 'name'
            });
        res.status(200).json(rawMaterials);
    } catch (error) {
        console.error('Error getting raw materials:', error);
        res.status(500).json({message: 'Error getting raw materials', error: error.message});
    }
};


// Get all active raw materials
exports.getAllActiveRawMaterials = async (req, res) => {
    try {
        const rawMaterials = await RawMaterial.find({status: 'active'})
            .sort({createdAt: -1}) // Tarihe göre azalan sıralama
            .populate({
                path: 'supplier',
                select: 'code'
            })
            .populate({
                path: 'type',
                select: 'name'
            });
        res.status(200).json(rawMaterials);
    } catch (error) {
        console.error('Error getting active raw materials:', error);
        res.status(500).json({message: 'Error getting active raw materials', error: error.message});
    }
};


// Get all passive raw materials
exports.getAllPassiveRawMaterials = async (req, res) => {
    try {
        const rawMaterials = await RawMaterial.find({status: 'passive'})
            .sort({createdAt: -1}) // Tarihe göre azalan sıralama
            .populate({
                path: 'supplier',
                select: 'code'
            })
            .populate({
                path: 'type',
                select: 'name'
            });
        res.status(200).json(rawMaterials);
    } catch (error) {
        console.error('Error getting passive raw materials:', error);
        res.status(500).json({message: 'Error getting passive raw materials', error: error.message});
    }
};


// GET ALL WITH PAGINATION //

// Get all raw materials with pagination
exports.getAllRawMaterialPagination = async (req, res) => {
    try {
        const {page = 1, limit = 5} = req.query; // Her sayfa için 5 öğe limiti

        const rawMaterials = await RawMaterial.find()
            .sort({createdAt: -1}) // Tarihe göre azalan sıralama
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate({
                path: 'supplier',
                select: 'code'
            })
            .exec();

        const count = await RawMaterial.countDocuments();

        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count
        });
    } catch (error) {
        console.error('Error getting raw materials:', error);
        res.status(500).json({message: 'Error getting raw materials', error: error.message});
    }
};


// Get all active raw materials with pagination
exports.getAllActiveRawMaterialPagination = async (req, res) => {
    try {
        const {page = 1, limit = 5} = req.query;
        const rawMaterials = await RawMaterial.find({status: 'active'})
            .sort({createdAt: -1})  // Tarihe göre azalan sıralama
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate({
                path: 'supplier',
                select: 'code'
            })
            .exec();

        const count = await RawMaterial.countDocuments({status: 'active'});

        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count
        });
    } catch (error) {
        console.error('Error getting raw materials:', error);
        res.status(500).json({message: 'Error getting raw materials', error: error.message});
    }
};

// hem çıkışı yapılmışları hem satılmışları getiricek

// Get all passive raw materials with pagination
exports.getAllPassiveRawMaterialPagination = async (req, res) => {
    try {
        const {page = 1, limit = 5} = req.query; // Her sayfa için 5 öğe limiti

        const rawMaterials = await RawMaterial.find({status: 'passive'})
            .sort({updatedAt: -1}) // updatedAt'e göre azalan sıralama
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .populate({
                path: 'supplier',
                select: 'code'
            })
            .exec();

        const count = await RawMaterial.countDocuments({status: 'passive'});

        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count
        });
    } catch (error) {
        console.error('Error getting passive raw materials:', error);
        res.status(500).json({message: 'Error getting passive raw materials', error: error.message});
    }
};


// GET DATE, NAME, TYPE //

// Get raw materials by date
exports.getRawMaterialsByDate = async (req, res) => {
    try {
        const {date} = req.query;
        const dateInTurkey = moment.tz(date, "Europe/Istanbul").startOf('day').toDate();
        const rawMaterials = await RawMaterial.find({createdAt: dateInTurkey}).populate({
            path: 'supplier',
            select: 'code'
        }).populate({
            path: 'type',
            select: 'name'
        });
        res.status(200).json(rawMaterials);
    } catch (error) {
        console.error('Error getting raw materials by date:', error);
        res.status(500).json({message: 'Error getting raw materials by date', error: error.message});
    }
};

// Get distinct values by name
exports.getDistinctValuesByName = async (req, res) => {
    try {
        const {name} = req.params;

        // Fields to get distinct values for
        const fields = [
            'type',
            'supplier',
            'grammage',
            'totalBobinweight',
            'meter',
            'bobinNumber',
            'bobinHeight',
            'bobinDiameter',
            'SquareMeter'
        ];

        // Object to hold distinct values for each field
        const distinctValues = {};

        for (const field of fields) {
            distinctValues[field] = await RawMaterial.find({name}).distinct(field);
        }

        res.status(200).json(distinctValues);
    } catch (error) {
        console.error('Error getting distinct values by name:', error);
        res.status(500).json({message: 'Error getting distinct values by name', error: error.message});
    }
};


// Get all distinct names
exports.getAllNames = async (req, res) => {
    try {
        const names = await RawMaterial.find().distinct('name');
        res.status(200).json(names);
    } catch (error) {
        console.error('Error getting names:', error);
        res.status(500).json({message: 'Error getting names', error: error.message});
    }
};

// Get all distinct types
exports.getAllTypes = async (req, res) => {
    try {
        const types = await RawMaterial.find().distinct('type');
        res.status(200).json(types);
    } catch (error) {
        console.error('Error getting types:', error);
        res.status(500).json({message: 'Error getting types', error: error.message});
    }
};


// FILTERS //
//

// statü kısmına satılmış eklenicek
// exports.filterRawMaterials = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             limit = 5,
//             name,
//             supplier,
//             type,
//             status,
//             soldToCustomer,
//             grammageComparison1,
//             grammageValue1,
//             grammageComparison2,
//             grammageValue2,
//             totalBobinweightComparison1,
//             totalBobinweightValue1,
//             totalBobinweightComparison2,
//             totalBobinweightValue2,
//             meterComparison1,
//             meterValue1,
//             meterComparison2,
//             meterValue2,
//             bobinNumberComparison1,
//             bobinNumberValue1,
//             bobinNumberComparison2,
//             bobinNumberValue2,
//             bobinHeightComparison1,
//             bobinHeightValue1,
//             bobinHeightComparison2,
//             bobinHeightValue2,
//             bobinDiameterComparison1,
//             bobinDiameterValue1,
//             bobinDiameterComparison2,
//             bobinDiameterValue2,
//             SquareMeterComparison1,
//             SquareMeterValue1,
//             SquareMeterComparison2,
//             SquareMeterValue2,
//             dateBefore,
//             dateAfter,
//             dateExact,
//             passiveDateBefore,
//             passiveDateAfter,
//             passiveDateExact
//         } = req.query;
//
//         let filterCriteria = {};
//
//         // Helper function to convert values to numbers
//         const parseNumber = (value) => {
//             const num = parseFloat(value);
//             return isNaN(num) ? null : num;
//         };
//
//         // Apply name, supplier, and type filters
//         if (name) filterCriteria.name = name;
//         if (supplier) filterCriteria.supplier = supplier;
//         if (type) filterCriteria.type = type;
//
//         // Status filter
//         if (status) {
//             filterCriteria.status = status;
//         }
//
//         // Apply the soldToCustomer filter to exclude null values when required
//         if (soldToCustomer === 'true') {
//             filterCriteria.customer = { $ne: null }; // Ensures customer exists and is not null
//         } else if (soldToCustomer === 'false') {
//             filterCriteria.$or = [{ customer: { $exists: false } }, { customer: null }]; // Exclude items with non-null customers
//         }
//
//         // Comparison criteria
//         const addComparisonFilter = (field, comparison1, value1, comparison2, value2) => {
//             const filter = {};
//
//             if (comparison1 === 'between' && value1 && value2) {
//                 filter.$gte = parseNumber(value1);
//                 filter.$lte = parseNumber(value2);
//             } else {
//                 if (value1 && comparison1) {
//                     filter[`$${comparison1}`] = parseNumber(value1);
//                 }
//                 if (value2 && comparison2) {
//                     filter[`$${comparison2}`] = parseNumber(value2);
//                 }
//             }
//
//             if (Object.keys(filter).length > 0) {
//                 filterCriteria[field] = filter;
//             }
//         };
//
//         // Apply filters
//         addComparisonFilter('grammage', grammageComparison1, grammageValue1, grammageComparison2, grammageValue2);
//         addComparisonFilter('totalBobinweight', totalBobinweightComparison1, totalBobinweightValue1, totalBobinweightComparison2, totalBobinweightValue2);
//         addComparisonFilter('meter', meterComparison1, meterValue1, meterComparison2, meterValue2);
//         addComparisonFilter('bobinNumber', bobinNumberComparison1, bobinNumberValue1, bobinNumberComparison2, bobinNumberValue2);
//         addComparisonFilter('bobinHeight', bobinHeightComparison1, bobinHeightValue1, bobinHeightComparison2, bobinHeightValue2);
//         addComparisonFilter('bobinDiameter', bobinDiameterComparison1, bobinDiameterValue1, bobinDiameterComparison2, bobinDiameterValue2);
//         addComparisonFilter('SquareMeter', SquareMeterComparison1, SquareMeterValue1, SquareMeterComparison2, SquareMeterValue2);
//
//         // Passive date filter to include only passive records
//         if (passiveDateExact || (passiveDateBefore && passiveDateAfter)) {
//             filterCriteria.status = 'passive';
//         }
//
//         // Entry date filters
//         if (dateExact) {
//             const exactDate = new Date(dateExact);
//             filterCriteria.createdAt = {
//                 $gte: new Date(exactDate.setHours(0, 0, 0, 0)),
//                 $lt: new Date(exactDate.setHours(23, 59, 59, 999))
//             };
//         } else {
//             if (dateBefore && dateAfter) {
//                 const afterDate = new Date(dateAfter);
//                 const beforeDate = new Date(dateBefore);
//                 afterDate.setHours(0, 0, 0, 0);
//                 beforeDate.setHours(23, 59, 59, 999);
//                 filterCriteria.createdAt = { $gte: afterDate, $lte: beforeDate };
//             } else if (dateBefore) {
//                 const beforeDate = new Date(dateBefore);
//                 beforeDate.setHours(23, 59, 59, 999);
//                 filterCriteria.createdAt = { $lte: beforeDate };
//             } else if (dateAfter) {
//                 const afterDate = new Date(dateAfter);
//                 afterDate.setHours(0, 0, 0, 0);
//                 filterCriteria.createdAt = { $gte: afterDate };
//             }
//         }
//
//         // Passive date filters
//         if (passiveDateExact) {
//             const exactPassiveDate = new Date(passiveDateExact);
//             filterCriteria.updatedAt = {
//                 $gte: new Date(exactPassiveDate.setHours(0, 0, 0, 0)),
//                 $lt: new Date(exactPassiveDate.setHours(23, 59, 59, 999))
//             };
//         } else {
//             if (passiveDateBefore && passiveDateAfter) {
//                 const afterPassiveDate = new Date(passiveDateAfter);
//                 const beforePassiveDate = new Date(passiveDateBefore);
//                 afterPassiveDate.setHours(0, 0, 0, 0);
//                 beforePassiveDate.setHours(23, 59, 59, 999);
//                 filterCriteria.soldAt = { $gte: afterPassiveDate, $lte: beforePassiveDate };
//             } else if (passiveDateBefore) {
//                 const beforePassiveDate = new Date(passiveDateBefore);
//                 beforePassiveDate.setHours(23, 59, 59, 999);
//                 filterCriteria.soldAt = { $lte: beforePassiveDate };
//             } else if (passiveDateAfter) {
//                 const afterPassiveDate = new Date(passiveDateAfter);
//                 afterPassiveDate.setHours(0, 0, 0, 0);
//                 filterCriteria.soldAt = { $gte: afterPassiveDate };
//             }
//         }
//
//         // Database query
//         const rawMaterials = await RawMaterial.find(filterCriteria)
//             .sort({ createdAt: -1 })
//             .skip((page - 1) * limit)
//             .limit(Number(limit))
//             .exec();
//
//         const count = await RawMaterial.countDocuments(filterCriteria);
//
//         res.status(200).json({
//             rawMaterials,
//             totalPages: Math.ceil(count / limit),
//             currentPage: Number(page),
//             totalItems: count
//         });
//     } catch (error) {
//         console.error('Error filtering raw materials:', error);
//         res.status(500).json({ message: 'Error filtering raw materials', error: error.message });
//     }
// };

exports.filterRawMaterials = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 5,
            name,
            supplier,
            type,
            statusType,
            customerId,
            grammageComparison1,
            grammageValue1,
            grammageComparison2,
            grammageValue2,
            totalBobinweightComparison1,
            totalBobinweightValue1,
            totalBobinweightComparison2,
            totalBobinweightValue2,
            meterComparison1,
            meterValue1,
            meterComparison2,
            meterValue2,
            bobinNumberComparison1,
            bobinNumberValue1,
            bobinNumberComparison2,
            bobinNumberValue2,
            bobinHeightComparison1,
            bobinHeightValue1,
            bobinHeightComparison2,
            bobinHeightValue2,
            bobinDiameterComparison1,
            bobinDiameterValue1,
            bobinDiameterComparison2,
            bobinDiameterValue2,
            SquareMeterComparison1,
            SquareMeterValue1,
            SquareMeterComparison2,
            SquareMeterValue2,
            dateBefore,
            dateAfter,
            dateExact,
            passiveDateBefore,
            passiveDateAfter,
            passiveDateExact,
            bobinweightComparison1, 
            bobinweightValue1, 
            bobinweightComparison2,
            bobinweightValue2
        } = req.query;

        let filterCriteria = {};

        // Helper function to convert values to numbers
        const parseNumber = (value) => {
            const num = parseFloat(value);
            return isNaN(num) ? null : num;
        };

        // Apply name, supplier, and type filters
        if (name) filterCriteria.name = name;
        if (supplier) filterCriteria.supplier = supplier;
        if (type) filterCriteria.type = type;

        // Status filter based on `statusType`
        if (statusType === 'active') {
            // Eğer `statusType` "active" ise, sadece aktif olanları filtrele
            filterCriteria.status = 'active';
        } else if (statusType === 'sold') {
            // Eğer `statusType` "sold" ise, pasif olup müşterisi olanları filtrele (yani satılmış olanlar)
            filterCriteria.status = 'passive';
            filterCriteria.customer = { $ne: null };  // Müşteri alanı null olmayanlar satılmış demektir
        } else if (statusType === 'removed') {
            // Eğer `statusType` "removed" ise, pasif olup müşteri bilgisi olmayanları filtrele (stoktan çıkmış olanlar)
            filterCriteria.status = 'passive';
            filterCriteria.$or = [{ customer: { $exists: false } }, { customer: null }]; // Müşteri bilgisi olmayanlar
        }

// Eğer customerId verildiyse, müşteri alanı verilen ID ile eşleşen, pasif durumdaki kayıtları filtrele
        if (customerId) {
            // Bu durumda sadece `status` pasif olanlara ve `customer` alanı belirtilen müşteri ID'sine eşit olanlara bakılacak
            filterCriteria.status = 'passive'; // Sadece pasif durumdaki veriler
            filterCriteria.customer = customerId; // Müşteri alanı verilen ID ile eşleşenler
        }

        // Comparison criteria
        const addComparisonFilter = (field, comparison1, value1, comparison2, value2) => {
            const filter = {};

            if (comparison1 === 'between' && value1 && value2) {
                filter.$gte = parseNumber(value1);
                filter.$lte = parseNumber(value2);
            } else {
                if (value1 && comparison1) {
                    filter[`$${comparison1}`] = parseNumber(value1);
                }
                if (value2 && comparison2) {
                    filter[`$${comparison2}`] = parseNumber(value2);
                }
            }

            if (Object.keys(filter).length > 0) {
                filterCriteria[field] = filter;
            }
        };

        // Apply filters
        addComparisonFilter('grammage', grammageComparison1, grammageValue1, grammageComparison2, grammageValue2);
        addComparisonFilter('totalBobinweight', totalBobinweightComparison1, totalBobinweightValue1, totalBobinweightComparison2, totalBobinweightValue2);
        addComparisonFilter('meter', meterComparison1, meterValue1, meterComparison2, meterValue2);
        addComparisonFilter('bobinNumber', bobinNumberComparison1, bobinNumberValue1, bobinNumberComparison2, bobinNumberValue2);
        addComparisonFilter('bobinHeight', bobinHeightComparison1, bobinHeightValue1, bobinHeightComparison2, bobinHeightValue2);
        addComparisonFilter('bobinDiameter', bobinDiameterComparison1, bobinDiameterValue1, bobinDiameterComparison2, bobinDiameterValue2);
        addComparisonFilter('SquareMeter', SquareMeterComparison1, SquareMeterValue1, SquareMeterComparison2, SquareMeterValue2);
        addComparisonFilter('bobinWeight', bobinweightComparison1, bobinweightValue1, bobinweightComparison2, bobinweightValue2);

        // Entry date filters
        if (dateExact) {
            const exactDate = new Date(dateExact);
            filterCriteria.createdAt = {
                $gte: new Date(exactDate.setHours(0, 0, 0, 0)),
                $lt: new Date(exactDate.setHours(23, 59, 59, 999))
            };
        } else {
            if (dateBefore && dateAfter) {
                const afterDate = new Date(dateAfter);
                const beforeDate = new Date(dateBefore);
                afterDate.setHours(0, 0, 0, 0);
                beforeDate.setHours(23, 59, 59, 999);
                filterCriteria.createdAt = { $gte: afterDate, $lte: beforeDate };
            } else if (dateBefore) {
                const beforeDate = new Date(dateBefore);
                beforeDate.setHours(23, 59, 59, 999);
                filterCriteria.createdAt = { $lte: beforeDate };
            } else if (dateAfter) {
                const afterDate = new Date(dateAfter);
                afterDate.setHours(0, 0, 0, 0);
                filterCriteria.createdAt = { $gte: afterDate };
            }
        }

        // Passive date filters
        if (passiveDateExact) {
            const exactPassiveDate = new Date(passiveDateExact);
            filterCriteria.updatedAt = {
                $gte: new Date(exactPassiveDate.setHours(0, 0, 0, 0)),
                $lt: new Date(exactPassiveDate.setHours(23, 59, 59, 999))
            };
        } else {
            if (passiveDateBefore && passiveDateAfter) {
                const afterPassiveDate = new Date(passiveDateAfter);
                const beforePassiveDate = new Date(passiveDateBefore);
                afterPassiveDate.setHours(0, 0, 0, 0);
                beforePassiveDate.setHours(23, 59, 59, 999);
                filterCriteria.soldAt = { $gte: afterPassiveDate, $lte: beforePassiveDate };
            } else if (passiveDateBefore) {
                const beforePassiveDate = new Date(passiveDateBefore);
                beforePassiveDate.setHours(23, 59, 59, 999);
                filterCriteria.soldAt = { $lte: beforePassiveDate };
            } else if (passiveDateAfter) {
                const afterPassiveDate = new Date(passiveDateAfter);
                afterPassiveDate.setHours(0, 0, 0, 0);
                filterCriteria.soldAt = { $gte: afterPassiveDate };
            }
        }

        // Database query
        const rawMaterials = await RawMaterial.find(filterCriteria)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .exec();

        const count = await RawMaterial.countDocuments(filterCriteria);

        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count
        });
    } catch (error) {
        console.error('Error filtering raw materials:', error);
        res.status(500).json({ message: 'Error filtering raw materials', error: error.message });
    }
};


exports.filterActiveRawMaterials = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 5,
            name,
            supplier,
            type,
            grammageComparison1,
            grammageValue1,
            grammageValue2,
            totalBobinweightComparison1,
            totalBobinweightValue1,
            totalBobinweightValue2,
            meterComparison1,
            meterValue1,
            meterValue2,
            bobinNumberComparison1,
            bobinNumberValue1,
            bobinNumberValue2,
            bobinHeightComparison1,
            bobinHeightValue1,
            bobinHeightValue2,
            bobinDiameterComparison1,
            bobinDiameterValue1,
            bobinDiameterValue2,
            SquareMeterComparison1,
            SquareMeterValue1,
            SquareMeterValue2,
            bobinweightComparison1,
            bobinweightValue1,
            bobinweightValue2,
            dateBefore,
            dateAfter,
            dateExact
        } = req.query;

        let filterCriteria = { status: 'active' };

        if (name) filterCriteria.name = name;
        if (supplier) filterCriteria.supplier = supplier;
        if (type) filterCriteria.type = type;

        const applyRangeFilter = (filterName, comparison, value1, value2) => {
            if (comparison === 'between' && value1 && value2) {
                filterCriteria[filterName] = {
                    $gte: parseNumber(value1),
                    $lte: parseNumber(value2)
                };
            } else if (comparison === 'lt' && value1) {
                filterCriteria[filterName] = { $lt: parseNumber(value1) };
            } else if (comparison === 'gt' && value1) {
                filterCriteria[filterName] = { $gt: parseNumber(value1) };
            } else if (comparison === 'eq' && value1) {
                filterCriteria[filterName] = { $eq: parseNumber(value1) };
            }
        };

        // Apply filters
        applyRangeFilter('grammage', grammageComparison1, grammageValue1, grammageValue2);
        applyRangeFilter('totalBobinweight', totalBobinweightComparison1, totalBobinweightValue1, totalBobinweightValue2);
        applyRangeFilter('meter', meterComparison1, meterValue1, meterValue2);
        applyRangeFilter('bobinNumber', bobinNumberComparison1, bobinNumberValue1, bobinNumberValue2);
        applyRangeFilter('bobinHeight', bobinHeightComparison1, bobinHeightValue1, bobinHeightValue2);
        applyRangeFilter('bobinDiameter', bobinDiameterComparison1, bobinDiameterValue1, bobinDiameterValue2);
        applyRangeFilter('SquareMeter', SquareMeterComparison1, SquareMeterValue1, SquareMeterValue2);
        applyRangeFilter('bobinWeight', bobinweightComparison1, bobinweightValue1, bobinweightValue2);

        if (dateExact) {
            const exactDate = new Date(dateExact);
            filterCriteria.createdAt = {
                $gte: new Date(exactDate.setHours(0, 0, 0, 0)),
                $lt: new Date(exactDate.setHours(23, 59, 59, 999))
            };
        } else {
            if (dateBefore && dateAfter) {
                const afterDate = new Date(dateAfter);
                const beforeDate = new Date(dateBefore);
                afterDate.setHours(0, 0, 0, 0);
                beforeDate.setHours(23, 59, 59, 999);
                filterCriteria.createdAt = { $gte: afterDate, $lte: beforeDate };
            } else if (dateBefore) {
                const beforeDate = new Date(dateBefore);
                beforeDate.setHours(23, 59, 59, 999);
                filterCriteria.createdAt = { $lte: beforeDate };
            } else if (dateAfter) {
                const afterDate = new Date(dateAfter);
                afterDate.setHours(0, 0, 0, 0);
                filterCriteria.createdAt = { $gte: afterDate };
            }
        }

        // Debugging the constructed filter criteria
        console.log("Filter Criteria:", filterCriteria);

        const rawMaterials = await RawMaterial.find(filterCriteria)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .exec();

        const count = await RawMaterial.countDocuments(filterCriteria);

        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count
        });
    } catch (error) {
        console.error('Error filtering active raw materials:', error);
        res.status(500).json({ message: 'Error filtering active raw materials', error: error.message });
    }
};




// Helper function to apply comparison operators based on input values
const applyComparisonFilter = (filterName, comparison, value1, value2) => {
    const parsedValue1 = parseNumber(value1);
    const parsedValue2 = parseNumber(value2);

    switch (comparison) {
        case 'eq': // equal
            return parsedValue1 !== null ? { [filterName]: parsedValue1 } : {};
        case 'lt': // less than
            return parsedValue1 !== null ? { [filterName]: { $lt: parsedValue1 } } : {};
        case 'lte': // less than or equal
            return parsedValue1 !== null ? { [filterName]: { $lte: parsedValue1 } } : {};
        case 'gt': // greater than
            return parsedValue1 !== null ? { [filterName]: { $gt: parsedValue1 } } : {};
        case 'gte': // greater than or equal
            return parsedValue1 !== null ? { [filterName]: { $gte: parsedValue1 } } : {};
        case 'between': // between two values
            return parsedValue1 !== null && parsedValue2 !== null
                ? { [filterName]: { $gte: parsedValue1, $lte: parsedValue2 } }
                : {};
        default:
            return {}; // No filter applied
    }
};

// Helper function to parse numerical values
const parseNumber = (value) => {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
};

// Filter passive raw materials
// exports.filterPassiveRawMaterials = async (req, res) => {
//     try {
//         const {
//             page = 1,
//             limit = 5,
//             name,
//             supplier,
//             type,
//             soldToCustomer,
//             grammageComparison1,
//             grammageValue1,
//             grammageValue2,
//             totalBobinweightComparison1,
//             totalBobinweightValue1,
//             totalBobinweightValue2,
//             meterComparison1,
//             meterValue1,
//             meterValue2,
//             bobinNumberComparison1,
//             bobinNumberValue1,
//             bobinNumberValue2,
//             bobinHeightComparison1,
//             bobinHeightValue1,
//             bobinHeightValue2,
//             bobinDiameterComparison1,
//             bobinDiameterValue1,
//             bobinDiameterValue2,
//             SquareMeterComparison1,
//             SquareMeterValue1,
//             SquareMeterValue2,
//             dateBefore,
//             dateAfter,
//             dateExact,
//             passiveDateBefore,
//             passiveDateAfter,
//             passiveDateExact
//         } = req.query;
//
//         let filterCriteria = { status: 'passive' };
//
//         if (name) filterCriteria.name = name;
//         if (supplier) filterCriteria.supplier = supplier;
//         if (type) filterCriteria.type = type;
//
//         // Add soldToCustomer filter to differentiate passive status
//         if (soldToCustomer === 'true') {
//             filterCriteria.customer = { $ne: null }; // Ensures customer exists and is not null
//         } else if (soldToCustomer === 'false') {
//             filterCriteria.$or = [{ customer: { $exists: false } }, { customer: null }]; // Exclude items with non-null customers
//         }
//
//
//         // Apply range and comparison filters
//         Object.assign(
//             filterCriteria,
//             applyComparisonFilter('grammage', grammageComparison1, grammageValue1, grammageValue2),
//             applyComparisonFilter('totalBobinweight', totalBobinweightComparison1, totalBobinweightValue1, totalBobinweightValue2),
//             applyComparisonFilter('meter', meterComparison1, meterValue1, meterValue2),
//             applyComparisonFilter('bobinNumber', bobinNumberComparison1, bobinNumberValue1, bobinNumberValue2),
//             applyComparisonFilter('bobinHeight', bobinHeightComparison1, bobinHeightValue1, bobinHeightValue2),
//             applyComparisonFilter('bobinDiameter', bobinDiameterComparison1, bobinDiameterValue1, bobinDiameterValue2),
//             applyComparisonFilter('SquareMeter', SquareMeterComparison1, SquareMeterValue1, SquareMeterValue2)
//         );
//
//         // Date filters
//         if (dateExact) {
//             const exactDate = new Date(dateExact);
//             filterCriteria.createdAt = {
//                 $gte: new Date(exactDate.setHours(0, 0, 0, 0)),
//                 $lt: new Date(exactDate.setHours(23, 59, 59, 999))
//             };
//         } else {
//             if (dateBefore && dateAfter) {
//                 const afterDate = new Date(dateAfter);
//                 const beforeDate = new Date(dateBefore);
//                 afterDate.setHours(0, 0, 0, 0);
//                 beforeDate.setHours(23, 59, 59, 999);
//                 filterCriteria.createdAt = { $gte: afterDate, $lte: beforeDate };
//             } else if (dateBefore) {
//                 const beforeDate = new Date(dateBefore);
//                 beforeDate.setHours(23, 59, 59, 999);
//                 filterCriteria.createdAt = { $lte: beforeDate };
//             } else if (dateAfter) {
//                 const afterDate = new Date(dateAfter);
//                 afterDate.setHours(0, 0, 0, 0);
//                 filterCriteria.createdAt = { $gte: afterDate };
//             }
//         }
//
//         // Passive date filters
//         if (passiveDateExact) {
//             const exactPassiveDate = new Date(passiveDateExact);
//             filterCriteria.soldAt = {
//                 $gte: new Date(exactPassiveDate.setHours(0, 0, 0, 0)),
//                 $lt: new Date(exactPassiveDate.setHours(23, 59, 59, 999))
//             };
//         } else {
//             if (passiveDateBefore && passiveDateAfter) {
//                 const afterPassiveDate = new Date(passiveDateAfter);
//                 const beforePassiveDate = new Date(passiveDateBefore);
//                 afterPassiveDate.setHours(0, 0, 0, 0);
//                 beforePassiveDate.setHours(23, 59, 59, 999);
//                 filterCriteria.soldAt = { $gte: afterPassiveDate, $lte: beforePassiveDate };
//             } else if (passiveDateBefore) {
//                 const beforePassiveDate = new Date(passiveDateBefore);
//                 beforePassiveDate.setHours(23, 59, 59, 999);
//                 filterCriteria.soldAt = { $lte: beforePassiveDate };
//             } else if (passiveDateAfter) {
//                 const afterPassiveDate = new Date(passiveDateAfter);
//                 afterPassiveDate.setHours(0, 0, 0, 0);
//                 filterCriteria.soldAt = { $gte: afterPassiveDate };
//             }
//         }
//
//         // Query and results
//         const rawMaterials = await RawMaterial.find(filterCriteria)
//             .sort({ createdAt: -1 })
//             .skip((page - 1) * limit)
//             .limit(Number(limit))
//             .exec();
//
//         const count = await RawMaterial.countDocuments(filterCriteria);
//
//         res.status(200).json({
//             rawMaterials,
//             totalPages: Math.ceil(count / limit),
//             currentPage: Number(page),
//             totalItems: count
//         });
//     } catch (error) {
//         console.error('Error filtering passive raw materials:', error);
//         res.status(500).json({ message: 'Error filtering passive raw materials', error: error.message });
//     }
// };

exports.filterPassiveRawMaterials = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 5,
            name,
            supplier,
            type,
            customerId,
            soldToCustomer,
            grammageComparison1,
            grammageValue1,
            grammageValue2,
            totalBobinweightComparison1,
            totalBobinweightValue1,
            totalBobinweightValue2,
            meterComparison1,
            meterValue1,
            meterValue2,
            bobinNumberComparison1,
            bobinNumberValue1,
            bobinNumberValue2,
            bobinHeightComparison1,
            bobinHeightValue1,
            bobinHeightValue2,
            bobinDiameterComparison1,
            bobinDiameterValue1,
            bobinDiameterValue2,
            SquareMeterComparison1,
            SquareMeterValue1,
            SquareMeterValue2,
            bobinweightComparison1,  
            bobinweightValue1,       
            bobinweightValue2,       
            dateBefore,
            dateAfter,
            dateExact,
            passiveDateBefore,
            passiveDateAfter,
            passiveDateExact
        } = req.query;

        // Default criteria to filter passive raw materials
        let filterCriteria = { status: 'passive' };

        // Name, supplier, and type filters
        if (name) filterCriteria.name = name;
        if (supplier) filterCriteria.supplier = supplier;
        if (type) filterCriteria.type = type;

        // Customer-based filtering
        if (customerId) {
            filterCriteria.customer = customerId;
        } else if (soldToCustomer === 'true') {
            filterCriteria.customer = { $ne: null };
        } else if (soldToCustomer === 'false') {
            filterCriteria.customer = { $eq: null };
        }

        // Apply range and comparison filters
        Object.assign(
            filterCriteria,
            applyComparisonFilter('grammage', grammageComparison1, grammageValue1, grammageValue2),
            applyComparisonFilter('totalBobinweight', totalBobinweightComparison1, totalBobinweightValue1, totalBobinweightValue2),
            applyComparisonFilter('meter', meterComparison1, meterValue1, meterValue2),
            applyComparisonFilter('bobinNumber', bobinNumberComparison1, bobinNumberValue1, bobinNumberValue2),
            applyComparisonFilter('bobinHeight', bobinHeightComparison1, bobinHeightValue1, bobinHeightValue2),
            applyComparisonFilter('bobinDiameter', bobinDiameterComparison1, bobinDiameterValue1, bobinDiameterValue2),
            applyComparisonFilter('SquareMeter', SquareMeterComparison1, SquareMeterValue1, SquareMeterValue2),
            applyComparisonFilter('bobinWeight', bobinweightComparison1, bobinweightValue1, bobinweightValue2) // New bobinweight filter
        );

        // Date filters
        if (dateExact) {
            const exactDate = new Date(dateExact);
            filterCriteria.createdAt = {
                $gte: new Date(exactDate.setHours(0, 0, 0, 0)),
                $lt: new Date(exactDate.setHours(23, 59, 59, 999))
            };
        } else {
            if (dateBefore && dateAfter) {
                const afterDate = new Date(dateAfter);
                const beforeDate = new Date(dateBefore);
                afterDate.setHours(0, 0, 0, 0);
                beforeDate.setHours(23, 59, 59, 999);
                filterCriteria.createdAt = { $gte: afterDate, $lte: beforeDate };
            } else if (dateBefore) {
                const beforeDate = new Date(dateBefore);
                beforeDate.setHours(23, 59, 59, 999);
                filterCriteria.createdAt = { $lte: beforeDate };
            } else if (dateAfter) {
                const afterDate = new Date(dateAfter);
                afterDate.setHours(0, 0, 0, 0);
                filterCriteria.createdAt = { $gte: afterDate };
            }
        }

        // Passive date filters
        if (passiveDateExact) {
            const exactPassiveDate = new Date(passiveDateExact);
            filterCriteria.soldAt = {
                $gte: new Date(exactPassiveDate.setHours(0, 0, 0, 0)),
                $lt: new Date(exactPassiveDate.setHours(23, 59, 59, 999))
            };
        } else {
            if (passiveDateBefore && passiveDateAfter) {
                const afterPassiveDate = new Date(passiveDateAfter);
                const beforePassiveDate = new Date(passiveDateBefore);
                afterPassiveDate.setHours(0, 0, 0, 0);
                beforePassiveDate.setHours(23, 59, 59, 999);
                filterCriteria.soldAt = { $gte: afterPassiveDate, $lte: beforePassiveDate };
            } else if (passiveDateBefore) {
                const beforePassiveDate = new Date(passiveDateBefore);
                beforePassiveDate.setHours(23, 59, 59, 999);
                filterCriteria.soldAt = { $lte: beforePassiveDate };
            } else if (passiveDateAfter) {
                const afterPassiveDate = new Date(passiveDateAfter);
                afterPassiveDate.setHours(0, 0, 0, 0);
                filterCriteria.soldAt = { $gte: afterPassiveDate };
            }
        }

        // Query and results
        const rawMaterials = await RawMaterial.find(filterCriteria)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .exec();

        const count = await RawMaterial.countDocuments(filterCriteria);

        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count
        });
    } catch (error) {
        console.error('Error filtering passive raw materials:', error);
        res.status(500).json({ message: 'Error filtering passive raw materials', error: error.message });
    }
};




// 1. Tüm durumlar için arama (status fark etmeksizin)
exports.searchNotesAllRawMaterials = async (req, res) => {
    try {
        const {searchQuery, page = 1, limit = 5} = req.query;

        let query = {};
        if (searchQuery) {
            query.notes = {$regex: searchQuery, $options: 'i'};
        }

        const rawMaterials = await RawMaterial.find(query)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .exec();

        const count = await RawMaterial.countDocuments(query);

        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count,
        });
    } catch (error) {
        console.error('Error searching raw materials by notes:', error);
        res.status(500).json({message: 'Error searching raw materials by notes', error: error.message});
    }
};


// 2. Sadece "active" status için arama
exports.searchNotesActiveRawMaterials = async (req, res) => {
    try {
        const {searchQuery, page = 1, limit = 5} = req.query;

        let query = {status: 'active'};
        if (searchQuery) {
            query.notes = {$regex: searchQuery, $options: 'i'};
        }

        const rawMaterials = await RawMaterial.find(query)
            .skip((page - 1) * limit)
            .limit(limit)
            .exec();

        const count = await RawMaterial.countDocuments(query);

        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count,
        });
    } catch (error) {
        console.error('Error searching raw materials by notes (active):', error);
        res.status(500).json({message: 'Error searching raw materials by notes (active)', error: error.message});
    }
};


// 3. Sadece "passive" status için arama
exports.searchNotesPassiveRawMaterials = async (req, res) => {
    try {
        // req.query'den parametreleri al
        const { searchQuery, page = 1, limit = 5 } = req.query;  // 'query' yerine 'searchQuery' kullandık

        // Arama sorgusunu 'passive' statüsü ile başlat
        let searchCriteria = { status: 'passive' };

        // Eğer 'searchQuery' varsa, 'notes' alanında bu sorguyu arama yap
        if (searchQuery) {
            searchCriteria.notes = { $regex: searchQuery, $options: 'i' };
        }

        // Sorguya göre pasif malzemeleri getir
        const rawMaterials = await RawMaterial.find(searchCriteria)
            .skip((page - 1) * limit) // Sayfalamayı uygula
            .limit(Number(limit)) // Limit'i uygula
            .exec();

        // Toplam pasif malzeme sayısını al
        const count = await RawMaterial.countDocuments(searchCriteria);

        // Sonuçları JSON olarak döndür
        res.status(200).json({
            rawMaterials,
            totalPages: Math.ceil(count / limit),
            currentPage: Number(page),
            totalItems: count,
        });
    } catch (error) {
        console.error('Error searching raw materials by notes (passive):', error);
        res.status(500).json({ message: 'Error searching raw materials by notes (passive)', error: error.message });
    }
};

exports.checkIfRawMaterialExists = async (req, res) => {
    try {
        const {
            name,
            supplier,
            type,
            grammage,
            totalBobinweight,
            meter,
            bobinNumber,
            bobinHeight,
            bobinDiameter,
        } = req.body;

        // Verilen kriterlere göre aynı özelliklere sahip aktif bir hammadde olup olmadığını kontrol et
        const existingMaterial = await RawMaterial.findOne({
            name,
            supplier,
            type,
            grammage,
            totalBobinweight,
            meter,
            bobinNumber,
            bobinHeight,
            bobinDiameter,
            status: 'active'  // Sadece aktif olanları kontrol et
        });

        // Aynı özelliklere sahip bir hammadde varsa 1, yoksa 0 döner
        return res.status(200).json({ exists: existingMaterial ? 1 : 0 });
    } catch (error) {
        console.error('Error while checking raw material existence:', error);
        res.status(500).json({ message: 'Error checking raw material existence', error: error.message });
    }
};




// Helper function to handle date filtering based on filterPeriod or custom date range
const getDateFilter = (filterPeriod, startDate, endDate) => {
  const now = new Date();
  let startDateFilter;

  switch (filterPeriod) {
    case 'daily':
      startDateFilter = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'weekly':
      startDateFilter = new Date(now.setDate(now.getDate() - 7));
      startDateFilter.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
      startDateFilter = new Date(now.setMonth(now.getMonth() - 1));
      startDateFilter.setHours(0, 0, 0, 0);
      break;
    case '6months':
      startDateFilter = new Date(now.setMonth(now.getMonth() - 6));
      startDateFilter.setHours(0, 0, 0, 0);
      break;
    case 'yearly':
      startDateFilter = new Date(now.setFullYear(now.getFullYear() - 1));
      startDateFilter.setHours(0, 0, 0, 0);
      break;
    default:
      startDateFilter = startDate ? new Date(startDate) : null;
  }

  const dateFilter = {};
  if (startDateFilter) dateFilter.$gte = startDateFilter;
  if (endDate) dateFilter.$lte = new Date(endDate);

  return dateFilter;
};

// Get Active Raw Material Distribution with Date Filtering
exports.getActiveRawDistribution = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filterPeriod, startDate, endDate);

    // Build match criteria for active raw materials
    const matchCriteria = { status: 'active' };
    if (Object.keys(dateFilter).length > 0) {
      matchCriteria.createdAt = dateFilter;
    }

    // Fetch all active raw materials with the provided criteria
    const activeRawMaterials = await RawMaterial.aggregate([
      { $match: matchCriteria }, // Filter for active raw materials and date range
      {
        $group: {
          _id: '$type', // Group by type
          totalGrammage: { $sum: '$grammage' }, // Sum the total grammage for each type
          totalBobinweight: { $sum: '$totalBobinweight' } // Sum total bobin weight for each type
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          type: '$_id', // Rename _id to type
          totalGrammage: 1,
          totalBobinweight: 1,
        },
      },
    ]);

    res.status(200).json(activeRawMaterials);
  } catch (error) {
    console.error('Error fetching active raw material distribution:', error);
    res.status(500).json({ error: 'An error occurred while fetching active raw material distribution data.' });
  }
};

// Get Passive Raw Material Distribution with Date Filtering
exports.getPassiveRawDistribution = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filterPeriod, startDate, endDate);

    // Build match criteria for passive raw materials
    const matchCriteria = { status: 'passive' };
    if (Object.keys(dateFilter).length > 0) {
      matchCriteria.createdAt = dateFilter;
    }

    // Fetch all passive raw materials with the provided criteria
    const passiveRawMaterials = await RawMaterial.aggregate([
      { $match: matchCriteria }, // Filter for passive raw materials and date range
      {
        $group: {
          _id: '$type', // Group by type
          totalGrammage: { $sum: '$grammage' }, // Sum the total grammage for each type
          totalBobinweight: { $sum: '$totalBobinweight' } // Sum total bobin weight for each type
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          type: '$_id', // Rename _id to type
          totalGrammage: 1,
          totalBobinweight: 1,
        },
      },
    ]);

    res.status(200).json(passiveRawMaterials);
  } catch (error) {
    console.error('Error fetching passive raw material distribution:', error);
    res.status(500).json({ error: 'An error occurred while fetching passive raw material distribution data.' });
  }
};

// Get Raw Material Distribution with Sales Ratio and Date Filtering
exports.getRawDistributionWithSalesRatio = async (req, res) => {
  try {
    const { filterPeriod, startDate, endDate } = req.query;
    const dateFilter = getDateFilter(filterPeriod, startDate, endDate);

    // Build match criteria for active raw materials
    const activeMatchCriteria = { status: 'active' };
    if (Object.keys(dateFilter).length > 0) {
      activeMatchCriteria.createdAt = dateFilter;
    }

    // Aggregate active raw materials based on type
    const activeRawDistribution = await RawMaterial.aggregate([
      { $match: activeMatchCriteria }, // Filter active raw materials and date range
      {
        $group: {
          _id: '$type', // Group by type
          totalGrammage: { $sum: '$grammage' }, // Sum the total grammage for each type
          totalBobinweight: { $sum: '$totalBobinweight' } // Sum total bobin weight for each type
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          type: '$_id', // Rename _id to type
          totalGrammage: 1,
          totalBobinweight: 1,
        },
      },
    ]);

    // Build match criteria for passive raw materials
    const passiveMatchCriteria = { status: 'passive' };
    if (Object.keys(dateFilter).length > 0) {
      passiveMatchCriteria.createdAt = dateFilter;
    }

    // Aggregate passive raw materials based on type
    const passiveRawDistribution = await RawMaterial.aggregate([
      { $match: passiveMatchCriteria }, // Filter passive raw materials and date range
      {
        $group: {
          _id: '$type', // Group by type
          totalGrammage: { $sum: '$grammage' }, // Sum the total grammage for each type
          totalBobinweight: { $sum: '$totalBobinweight' } // Sum total bobin weight for each type
        },
      },
      {
        $project: {
          _id: 0, // Exclude _id from the output
          type: '$_id', // Rename _id to type
          totalGrammage: 1,
          totalBobinweight: 1,
        },
      },
    ]);

    // Create a map of passive raw material quantities by type for easy lookup
    const passiveRawMap = passiveRawDistribution.reduce((acc, rawMaterial) => {
      acc[rawMaterial.type] = rawMaterial.totalGrammage;
      return acc;
    }, {});

    // Calculate the Raw Material Stock-to-Sales Ratio for each type
    const rawToSalesRatio = activeRawDistribution.map((activeRaw) => {
      const type = activeRaw.type;
      const activeGrammage = activeRaw.totalGrammage;
      const soldGrammage = passiveRawMap[type] || 0; // If no sold amount found, set to 0
      const ratio = soldGrammage === 0 ? 0 : (activeGrammage / soldGrammage).toFixed(2); // Calculate ratio, handle divide by zero

      return {
        type,
        activeGrammage,
        soldGrammage,
        stockToSalesRatio: ratio,
      };
    });

    // Send the combined data back to the client
    res.status(200).json({
      activeRawDistribution,
      passiveRawDistribution,
      rawToSalesRatio,
    });
  } catch (error) {
    console.error('Error fetching raw material distribution with sales ratio:', error);
    res.status(500).json({ error: 'An error occurred while fetching raw material distribution with sales ratio.' });
  }
};
// Get Raw Material In and Out Analysis (Daily, Weekly, Monthly, Yearly)
exports.getRawMaterialInOutAnalysis = async (req, res) => {
    try {
      const { filterPeriod, startDate, endDate } = req.query;
      const dateFilter = getDateFilter(filterPeriod, startDate, endDate);
  
      // Build match criteria for stock in and stock out using the createdAt and soldAt fields
      const stockInCriteria = {};
      const stockOutCriteria = {};
  
      if (Object.keys(dateFilter).length > 0) {
        stockInCriteria.createdAt = dateFilter; // Filter for stock added to inventory (createdAt)
        stockOutCriteria.soldAt = dateFilter;   // Filter for stock removed from inventory (soldAt)
      }
  
      // Aggregate raw material data to calculate stock in based on createdAt
      const rawMaterialIn = await RawMaterial.aggregate([
        { $match: { ...stockInCriteria, status: 'active' } }, // Match criteria for raw materials added to stock
        {
          $group: {
            _id: null, // No grouping by any specific field, we want total sum
            totalInGrammage: { $sum: '$grammage' }, // Sum of grammage for added raw materials
            totalInBobinweight: { $sum: '$totalBobinweight' }, // Sum of total bobin weight
          },
        },
        {
          $project: {
            _id: 0,
            totalInGrammage: 1,
            totalInBobinweight: 1,
          },
        },
      ]);
  
      // Aggregate raw material data to calculate stock out based on soldAt
      const rawMaterialOut = await RawMaterial.aggregate([
        { $match: { ...stockOutCriteria, status: 'active', soldAt: { $ne: null } } }, // Match criteria for raw materials removed from stock
        {
          $group: {
            _id: null,
            totalOutGrammage: { $sum: '$grammage' }, // Sum of grammage for sold/removed raw materials
            totalOutBobinweight: { $sum: '$totalBobinweight' }, // Sum of total bobin weight
          },
        },
        {
          $project: {
            _id: 0,
            totalOutGrammage: 1,
            totalOutBobinweight: 1,
          },
        },
      ]);
  
      res.status(200).json({
        totalIn: rawMaterialIn.length > 0 ? rawMaterialIn[0] : { totalInGrammage: 0, totalInBobinweight: 0 },
        totalOut: rawMaterialOut.length > 0 ? rawMaterialOut[0] : { totalOutGrammage: 0, totalOutBobinweight: 0 },
      });
    } catch (error) {
      console.error('Error fetching raw material in and out analysis:', error);
      res.status(500).json({ error: 'An error occurred while fetching raw material in and out analysis.' });
    }
  };
  