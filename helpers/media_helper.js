const { unlink } = require('fs/promises');
const multer = require('multer');
const path = require('path');

const ALLOWED_EXTENTIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/jpg': 'jpg',
};

const storage = multer.diskStorage({
    destination: function(_,__,cb){
        cb(null,'public/uploads');
    },
    filename: function(_,file,cb){
        const filename = file.originalname.replace(' ', '-').replace('.png', '').replace('.jpg', '').replace('.jpeg', '');
        const extension = ALLOWED_EXTENTIONS[file.mimetype];
        cb(null,`${filename}-${Date.now()}.${extension}`);
    }
})
exports.upload = multer({
    storage: storage,
    //5mb
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_,file,cb) => {
        const isValid = ALLOWED_EXTENTIONS[file.mimetype];
        let uploadError = new Error(`invalid image type\n ${file.mimetype} is not allowed`);
        if (!isValid) return cb(uploadError);
        return cb(null,true);
    },
});


exports.deleteImages = async function (imageUrls,continueOnErrorName){
    await Promise.all(
        imageUrls.map(async (imageUrl) => {
            const imagePath = path.resolve(
                __dirname,
                '..',
                'public',
                'uploads',
                path.basename(imageUrl)
            );
            try{
                await unlink(imagePath);
            } catch (error) {
                if(error.code === continueOnErrorName){
                      console.error(`Continuing with the next image: ${error.message}`);

                }else { 
                    console.error(`Error deleting image: ${error.message}`);
                    throw error;
                }
            }
        })
    );
};