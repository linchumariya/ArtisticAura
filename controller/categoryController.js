const Category = require("../model/categoryModel");
const STATUS_CODES=require("../helper/statusCode")


const loadcategorylist = async function (req, res) {
    try {
      const data = await Category.find();
      res.status(STATUS_CODES.OK).render('admin/category-list', { data: data });
    } catch (error) {
      console.error("Error fetching category data:", error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
  };

const loadCategory=async(req,res)=>{
    try {
        const { name, description } = req.body;
        const id = req.params.id;
        if (!name || !description) {
          return res.status(STATUS_CODES.BAD_REQUEST).redirect("/categoryList");
      }
       
      const categoryExist = await Category.findOne({name: { $regex: `^${name}$`, $options: 'i' }})
      if (!categoryExist) {
        const categoryadded =new Category( {
          name:name,
          description:description,
          islisted:true
        } )  
        
       await categoryadded.save()
       res.status(STATUS_CODES.CREATED).json({ success: true, message: 'Category added successfully.', redirect: "/categorylist" });
      
    }else{
      res.status(STATUS_CODES.CONFLICT).json({ success: false, message: 'Category already exists.', redirect: "/categorylist" });
    }

    } catch (error) {
        console.error(error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal Server Error.' });
    }
}
const toggleCategoryStatus = async (req, res) => {
  try {
      const categoryId = req.query.id;
      const category = await Category.findById(categoryId);  
      if (category) {
      
        const newStatus = !category.islisted;
        await Category.findByIdAndUpdate(categoryId, { islisted: newStatus });
        res.status(STATUS_CODES.OK).redirect('/categoryList');
    } else {
        res.status(STATUS_CODES.NOT_FOUND).send("Category not found.");
    }
} catch (error) {
    console.error("Error toggling category status:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
}
};
  
const loadeditcategorypage=async function(req, res) {
  try {
    const id=req.query.id;
      const data = await Category.findOne({_id:id})
      res.status(STATUS_CODES.OK).render('admin/category-edit', { data: data, message: undefined });
  } catch (error) {
      console.error("Error fetching category data:", error);
      res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
};  
const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    const category = req.body;
    const existingCategory = await Category.findOne({name: { $regex: `^${category.categoryName}$`, $options: 'i' },
      _id: { $ne: id } 
    
    });
    if (!existingCategory||existingCategory._id.toString() === id) {
      await Category.findByIdAndUpdate(id, {
        name: category.categoryName,
        description: category.description,
      });
      res.status(STATUS_CODES.OK).json({ success: true, message: "Update successful", redirect: "/categorylist" });
    } else {
     
      res.status(STATUS_CODES.CONFLICT).json({ success: false, message: "Category already exists" });
    }
  } catch (error) {
    

    console.error("Error updating category:", error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: "Internal Server Error", redirect: "/categorylist" });
  }
}; 

module.exports={
  loadCategory,
  loadcategorylist,
  toggleCategoryStatus,
  loadeditcategorypage,
  updateCategory

}