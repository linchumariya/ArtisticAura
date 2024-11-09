const userModel=require("../model/userModel")
const paginationHelper=require('../helper/paginationHelper')
const STATUS_CODES=require("../helper/statusCode")

const loadcustomermanagement = async (req, res) => {
  try {
    let { sortData,sortOrder } = req.query;
    const { search = '' } = req.query;
    const limit = 10;
    let page = Number(req.query.page);
    if (isNaN(page) || page < 1) {                                  
        page = 1;
    }
    if(!sortData)
    {  
      sortData = "name"
    }
    const sort = {};
    sort[sortData] =1

    if (sortData) {
      sort[sortData] = (sortOrder === 'asc') ? 1 : -1;
  }
    const searchCriteria = {};
    if (search) {
        searchCriteria.$or = [
            { name: { $regex: search, $options: 'i' } },
            { 'email': { $regex: search, $options: 'i' } }
        ];
    }

    const filteredData= await userModel.find(searchCriteria)
    .sort(sort) 
    .skip((page - 1) * paginationHelper.USERS_PER_PAGE)
    .limit(limit); 

    const usersCount = await userModel.countDocuments(searchCriteria);  
    res.status(STATUS_CODES.OK).render("admin/customer-list",{
          data:filteredData,
          currentPage : page,
          hasNextPage : usersCount  >  page * paginationHelper.USERS_PER_PAGE,
          hasPrevPage : page > 1,
          nextPage : page + 1,
          prevPage: page - 1,
          lastPage : Math.ceil(usersCount/ paginationHelper.USERS_PER_PAGE),
          search : search,
          sortData: sortData,
          sortOrder: sortOrder}
    );

  } catch (error) {
    console.error("Error in customer management:", error);
        res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Internal Server Error");
  }
}

const blockOrUnblockcustomer = async (req, res) => {
  try {
      const { id } = req.params;
      const user = await userModel.findById(id);

      if (!user) {
        return res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: 'Invalid user ID' });
      }

      user.isBlocked = !user.isBlocked;
      await user.save();
      console.log("iam staus",user.isBlocked);
      
      return res.status(STATUS_CODES.OK).json({ success: true, flag: user.isBlocked ? 1 : 0 });
  } catch (error) {
    console.error("Error blocking/unblocking customer:", error.message);
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({ success: false, message: 'Internal server error' });
  }
};
module.exports={
  loadcustomermanagement,
  blockOrUnblockcustomer,
}