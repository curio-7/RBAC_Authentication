import { Router } from "express"
import { 

    loginUser,
    logoutUser,
    registerUser,
    getAllUsers,
    getCurrentUser,
    updateUser,
    deleteUser,
    getDashboard,
    getSetting,
    getStatistics

} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {checkRole} from "../middlewares/access.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },{
            name: "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

//protected apis
router.route("/logout").post(verifyJWT,logoutUser)
// Specific Roles
router.route("/dashboard").get(verifyJWT,checkRole("admin"),getDashboard)
router.route("/statistics").get(verifyJWT,checkRole("admin"),getStatistics)
router.route("/setting").get(verifyJWT,getSetting)
router.route("/allusers").get(verifyJWT,checkRole("admin"),getAllUsers)
router.route("/:id").get(verifyJWT,checkRole("admin"),getCurrentUser)
router.route("/update/:id").patch(verifyJWT,checkRole("admin"),updateUser)
router.route("/delete/:id").delete(verifyJWT,checkRole("admin"),deleteUser)



export default router