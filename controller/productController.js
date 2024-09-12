const ProductModel = require("../model/productModel");
const CategoryModel = require("../model/categoryModel");
const PaginationHelper = require("../helper/paginationHelper");

const multer = require("multer");
const sharp = require("sharp");

const storage = multer.diskStorage({
  destination: "public/product_images",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
      cb(null, true);
  } else {
      cb(new Error('Please upload an image file.'));
  }
};
const upload = multer({
  storage: storage,

  fileFilter: function (req, file, cb) {
    cb(null, true);
  },
});

const getProductList = async (req, res) => {
  try {
    const products = await ProductModel.find().populate("category");
    console.log("enter in to the product-list");
    let { page } = req.query;

    if (!page) {
      page = 1;
    }
    console.log("page",page);

    const productTotalCount = await ProductModel.countDocuments({})
    const ITEMS_PER_PAGE = PaginationHelper.PRODUCT_PER_PAGE;

    console.log(productTotalCount,ITEMS_PER_PAGE,page)

    res.render("admin/product-list", {
      products: products,
      currentPage: page,
      hasNextPage: productTotalCount > page * ITEMS_PER_PAGE,
      hasPrevPage: page > 1,
      nextPage: page + 1,
      prevPage :page-1,
      lastPage: Math.ceil(productTotalCount / ITEMS_PER_PAGE),
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const getAddProducts = async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    res.render("admin/add-product", { categories });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const postAddproducts = async (req, res) => {
  upload.array("images")(req, res, async (err) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
    try {
      const { productName, description, category, price, oldPrice, stock,discount } =
        req.body;
      console.log(req.body);

      // const priceNum = parseFloat(price);
      // const oldPriceNum = parseFloat(oldPrice);
      // let discount = 0;
      
      // if (!isNaN(priceNum) && !isNaN(oldPriceNum) && oldPriceNum > 0) {
      //   discount = Math.round(((oldPriceNum - priceNum) / oldPriceNum) * 100);
      // }

      

        console.log(discount);


      const image = req.files.map((file) => `${file.filename}`);
      const newProduct = new ProductModel({
        productName: productName,
        description: description,
        category: category,
        price: price,
        oldPrice: oldPrice,
        stock: stock,
        discount:discount,
        image: image,
      });

      const productData = await newProduct.save();

      console.log("enter in to the add-list");
      console.log(productData);
      res.redirect("/productList");
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  });
};

const publishProduct = async (req, res, next) => {
  try {
    const Id = req.params.Id;
    await ProductModel.findByIdAndUpdate(Id, { ispublished: true });
    res.redirect("/productList");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};
const unpublishProduct = async (req, res, next) => {
  try {
    const Id = req.params.Id;
    await ProductModel.findByIdAndUpdate(Id, { ispublished: false });
    res.redirect("/productList");
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const getEditProduct = async (req, res) => {
  try {
    console.log("enter to edit product");
    const Id = req.query.id;
    console.log(req.query)
    console.log("iddd", Id);
    const products = await ProductModel.findById({ _id: Id });
    console.log(products);

    if (!products) {
      return res.redirect("/productList");
    } 
    else {
      const categories = await CategoryModel.find();
      console.log("enter to edit product");
      res.render("admin/product-edit", { categories, product: products });
    }
    // productimage:product.image[0]
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};


const postEditProduct = async (req, res) => {
  // const id = req.params.Id;
  const id = req.query.id;
  console.log("iddd", id);

  try {
      upload.array('images')(req, res, async (err) => {
          if (err) {
              return res.json({ message: err.message, type: 'danger' });
          }

          const existingProduct = await ProductModel.findById(id);
          console.log(existingProduct.image);
     
          console.log(req.files);

          // Get the new images if any, or use existing images
          const images = req.files.map((file) => `${file.filename}`) ;

          const result = {
              productName: req.body.productName || existingProduct.productName,
              description: req.body.description || existingProduct.description, 
              category: req.body.category || existingProduct.category,
              price: req.body.price || existingProduct.price,
              oldPrice: req.body.oldPrice || existingProduct.oldPrice,
              stock: req.body.stock || existingProduct.stock,
              discount:req.body.discount, 
              image: images
          };

          const updateProduct = await ProductModel.findByIdAndUpdate(id, result, { new: true });

          res.redirect('/productList');
      });
  } catch (err) {
      console.error(err);
      res.json({ message: err.message, type: 'danger' });
  }
}







// const postEditProduct = async (req, res) => {
//   try {
//     console.log("postEditProduct");
//            // console.log("body", req.body);
//            const id = req.query.id;
//           //  console.log(req.query)
//            console.log("iddd", id);
//            console.log("Received form data:", req.body);
//       console.log("Received files:", req.files);
//            upload.array('images')(req, res, async (err) => {
//             if (err) {
//                 return res.json({ message: err.message, type: 'danger' });
//             }
//             // const existingProduct = await ProductModel.findById(id);
//     // console.log("Received form data:", req.body);
//     // const name = req.body.productName;
//     // console.log("name", name);
//     // const discount =
//     //   Math.floor(((req.body.oldPrice) - (req.body.price)) / (req.body.oldPrice)) * 100;
//     //   console.log("discount is this", discount);
//       // const image = req.files.map((file) => `${file.filename}`);
//       // console.log(image);
//       const image = req.files && req.files.length > 0 ? req.files.map((file) => `${file.filename}`):req.body.image;

//     const updateparameter = {
//       productName: req.body.productName,
//       description: req.body.description,
//       price: req.body.price,
//       stock: req.body.stock,
//       oldPrice: req.body.oldPrice,
//       category:req.body.category,
//       discount:req.body.discount, 
//       image,
//     };
//  const productData = await ProductModel.findByIdAndUpdate(id, updateparameter);
//     console.log("updatd success");
//  console.log(productData); 
//     // const image=req.files.length>0?req.files.map(file=>`${file.filename}`): existingProduct.image;
//     // const result={
//     //     productName
//     // }
// res.redirect("/productList")
//   });
//  } catch (error) {
//     console.log(error);
//     res.status(500).send("Internal Server Error");
//     // res.redirect("/productList");
//   }
// };

module.exports = {
  postAddproducts,
  getProductList,
  getAddProducts,
  publishProduct,
  unpublishProduct,
  getEditProduct,
  postEditProduct,
};
