const Category = require("../model/categoryModel");



const loadcategorylist = async function (req, res) {
    try {
      const data = await Category.find();
      console.log("enter into category login");
      res.render('admin/category-list', { data: data });
    } catch (error) {
      console.error("Error fetching category data:", error);
      res.status(500).send("Internal Server Error");
    }
  };

const loadCategory=async(req,res)=>{
    try {
     
        const { name, description } = req.body;
        
    
      if(req.body.name===""){
        return  res.redirect("/categoryList")
      }
       
      if(req.body.description===""){
       return res.redirect("/categoryList")
      }
       
      const categoryExist = await Category.findOne({name:name.trim()})
      if (!categoryExist) {
        const categoryadded =new Category( {
          name:name,
          description:description,
          islisted:true
        } )  
        
       await categoryadded.save()
       res.json({ success: true, message: 'Category added successfully.',redirect:"/categorylist" })
        // res.redirect("/categoryList")
    }else{
      res.json({ success: false, message: 'Category already exists.',redirect:"/categorylist" })
      // res.status(400).send("Category already exists.")
       
    }

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error.' });
    }
}
const toggleCategoryStatus = async (req, res) => {
  try {
      const categoryId = req.query.id;
      console.log(`toggleCategoryStatus called with categoryId: ${categoryId}`);
      const category = await Category.findById(categoryId);
      console.log(`Category found: ${category}`);
      if (category) {
        // Toggle the status
        const newStatus = !category.islisted;
        await Category.findByIdAndUpdate(categoryId, { islisted: newStatus });
        console.log(`Category status updated to: ${newStatus}`);
        
        res.redirect('/categoryList');
    } else {
        console.log(`Category not found for ID: ${categoryId}`);
        res.status(404).send("Category not found.");
    }
} catch (error) {
    console.error("Error toggling category status:", error);
    res.status(500).send("Internal Server Error");
}
};
  
const loadeditcategorypage=async function(req, res) {
  try {
    const id=req.query.id;
      const data = await Category.findOne({_id:id})
      console.log(data);
     
      res.render('admin/category-edit', { data: data,message:undefined });
  } catch (error) {
      console.error("Error fetching category data:", error);
      res.status(500).send("Internal Server Error");
  }
};  
const updateCategory = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const category = req.body;
    console.log("body ; ",req.body)
    
    const existingCategory = await Category.findOne({ name: category.categoryName });
    console.log(existingCategory);
    if (!existingCategory||existingCategory._id.toString() === id) {
      await Category.findByIdAndUpdate(id, {
        name: category.categoryName,
        description: category.description,
      });

      
      // res.redirect("/categorylist");
      res.json({success:true, message:"update success", redirect:"/categorylist" })
    } else {
      // category._id = id
      // res.render(`admin/category-edit`,{message:'something is wrong', data:category });
      res.json({success:false, message:"category already exist"})
    }
  } catch (error) {
    
    // res.redirect("/categorylist");
    // res.status(500).send("Internal Server Error");
    console.error("Error updating category:", error);
    res.json({success:false, message:"Internal Server Error", redirect:"/categorylist"})
  }
}; 

module.exports={
  loadCategory,
  loadcategorylist,
  toggleCategoryStatus,
  loadeditcategorypage,
  updateCategory

}