const ProductModel = require("../model/productModel");
const CategoryModel = require("../model/categoryModel");
const PaginationHelper = require("../helper/paginationHelper");
const STATUS_CODES=require("../helper/statusCode")
const multer = require("multer");
// const sharp = require("sharp");

const storage = multer.diskStorage({
  destination: "public/product_images",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const fileFilter = (req, file, cb) => {
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
    let { page } = req.query;
    if (!page) {
      page = 1;
    }
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
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

const getAddProducts = async (req, res) => {
  try {
    const categories = await CategoryModel.find();
    res.status(STATUS_CODES.OK).render("admin/add-product", { categories });
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

const postAddproducts = async (req, res) => {
  upload.array("images")(req, res, async (err) => {
    if (err) {
      console.log(err);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
    try {
      const { productName, description, category, price, oldPrice, stock,discount } =
        req.body;
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

     await newProduct.save();
      res.status(STATUS_CODES.CREATED).redirect("/productList");
    } catch (error) {
      console.log(error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
  });
};

const publishProduct = async (req, res, next) => {
  try {
    const Id = req.params.Id;
    await ProductModel.findByIdAndUpdate(Id, { ispublished: true });
    res.status(STATUS_CODES.OK).redirect("/productList");
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};
const unpublishProduct = async (req, res, next) => {
  try {
    const Id = req.params.Id;
    await ProductModel.findByIdAndUpdate(Id, { ispublished: false });
    res.status(STATUS_CODES.OK).redirect("/productList");
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};

const getEditProduct = async (req, res) => {
  try {
    const Id = req.query.id;
    const products = await ProductModel.findById({ _id: Id });
    if (!products) {
      return res.status(STATUS_CODES.NOT_FOUND).redirect("/productList");
    } 
    else {
      const categories = await CategoryModel.find();
      res.status(STATUS_CODES.OK).render("admin/product-edit", { categories, product: products });
    }
  } catch (error) {
    console.log(error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error")
  }
};


const postEditProduct = async (req, res) => {
  console.log("enter into product edit")
  const id = req.query.id;

  try {
      upload.array('images')(req, res, async (err) => {
          if (err) {
              return res.json({ message: err.message, type: 'danger' });
          }

          const existingProduct = await ProductModel.findById(id);
     
          console.log("existing image",req.files);
          let images = [...existingProduct.image];
         
          if (req.files && req.files.length > 0) {
              req.files.forEach((file) => {
                 
                  const match = file.filename.match(/cropped_image_(\d+)\.jpg/);
                  console.log("iam match",match)
                  if (match) {
                      const currentIndex = parseInt(match[1], 10);
                      if (currentIndex >= 0 && currentIndex < images.length) {
                          images[currentIndex] = file.filename;
                      }
                  }
                });
                }

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
           await ProductModel.findByIdAndUpdate(id, result, { new: true });
           res.status(STATUS_CODES.OK).redirect('/productList');
      });
  } catch (err) {
      console.error(err);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ message: err.message, type: 'danger' });
  }
}

module.exports = {
  postAddproducts,
  getProductList,
  getAddProducts,
  publishProduct,
  unpublishProduct,
  getEditProduct,
  postEditProduct,
};
