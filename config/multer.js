// const multer = require("multer");


// // Disk Storage
// var storage = multer.diskStorage({
//     destination: function (req, product_image, cb) {
//         cb(null, "./public/uploads/")
//     },
//     filename: function (req, product_image, cb) {
//         cb(null, Date.now() + '-' + product_image.originalname)
//     }
// })

// // File FIlter
// const fileFilter = (req, file, cb) => {
//     if (
//       file.mimetype === "image/png" ||
//       file.mimetype === "image/jpg" ||
//       file.mimetype === "image/jpeg"
//     ) {
//       cb(null, true);
//     } else {
//       cb(new Error("File format should be PNG,JPG,JPEG"), false); // if validation failed then generate error
//     }
//   };

// let uploads = multer({ 
//     storage: storage,
//     limits:{fileSize: 500 * 500},
//     fileFilter: fileFilter
// }).single('product_image');


// module.exports = uploads;

const multer = require('multer')

module.exports = multer({
  storage: multer.diskStorage({}),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/jpe|jpeg|png|gif$i/)) {
      cb(new Error('File is not supported'), false)
      return
    }

    cb(null, true)
  }
})