const mongoose = require('mongoose');
const dotenv = require('dotenv');
const RawMaterial = require('../src/models/raw'); // RawMaterial model dosyasının doğru yolu
const User = require('../src/models/user'); // User model dosyasının doğru yolu
const { v4: uuidv4 } = require('uuid'); // UUID kütüphanesi

dotenv.config(); // .env dosyasındaki bilgileri kullanmak için

// Veritabanına bağlanma
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('MongoDB connected');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});

// Rastgele değer üreten fonksiyon
const generateRandomValue = () => Math.floor(Math.random() * 5000) + 1;

// Rastgele bir tedarikçi seçme fonksiyonu
const supplierCodes = [
    'A0000', 'AA01', 'A111', 'AA20', 'ARP354', 'KM11',
    'MMM3', 'PRP30', 'KSS10', 'SOC123', 'SS88',
    'premobil', 'Mbtest', 'dsf'
];

// Dummy verileri oluşturma fonksiyonu
async function createDummyRawMaterials() {
    try {
        // Varsayılan kullanıcı ID'si (mevcut bir kullanıcıyı kullanabilirsiniz)
        const defaultUser = await User.findOne(); // Bu projede mevcut bir kullanıcıyı seçin

        if (!defaultUser) {
            console.error('No default user found. Please create a user first.');
            return;
        }

        // Benzersiz batch ID oluşturuyoruz (Bu ID'yi sonradan toplu silmek için kullanacağız)
        const batchId = uuidv4(); // Benzersiz batch ID oluştur

        const dummyData = [];

        for (let i = 0; i < 50000; i++) {
            const rawMaterial = new RawMaterial({
                name: `Material ${String.fromCharCode(65 + (i % 26))}`,
                supplier: supplierCodes[Math.floor(Math.random() * supplierCodes.length)], // Rastgele tedarikçi seç
                type: `Type ${1 + (i % 3)}`, // Type 1, 2, 3 döngü
                grammage: generateRandomValue(),
                totalBobinweight: generateRandomValue(),
                meter: generateRandomValue(),
                bobinNumber: generateRandomValue(),
                bobinHeight: generateRandomValue(),
                bobinDiameter: generateRandomValue(),
                SquareMeter: generateRandomValue(),
                notes: i % 2 === 0 ? 'Urgent stock' : 'Regular stock',
                createdBy: defaultUser._id, // Mevcut bir kullanıcı ID'si eklenir
                updatedBy: defaultUser._id, // Aynı kullanıcı ID'sini güncelleme için ekliyoruz
                batchId: batchId // Eklenen veriler için benzersiz batch ID ekle
            });
            dummyData.push(rawMaterial);
        }

        // Toplu olarak veritabanına ekleyin
        await RawMaterial.insertMany(dummyData);
        console.log(`Dummy raw materials added successfully with batch ID: ${batchId}`);
        console.log(`Use this batch ID to delete these records: ${batchId}`);
        process.exit();
    } catch (error) {
        console.error('Error adding dummy raw materials:', error);
        process.exit(1);
    }
}

createDummyRawMaterials();