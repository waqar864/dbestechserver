
const cron = require('node-cron');
const { Product } = require('../models/product');
const { Category } = require('../models/category');

cron.schedule('0 0 * * *', async function (){
    try {
        const categoriesToBeDeleted = await Category.find({markedForDeletion: true});
        for(const category of categoriesToBeDeleted) {
            const categoryProductsCount = await Product.countDocuments({
                category: category.id,
            });
            if(categoryProductsCount < 1) await category.deleteOne();
        }
        console.log('CRON job completed at ', new Date());
    } catch (error) {
        console.error('CRON JOB ERROR', error);

    }
});