import { ApiError } from "../utils/ApiError.js"

const checkRole = function requireRole(role) {
    return function (req, res, next) {
        try {
            console.log(req.user.role)
            if (req.user.role && req.user.role === role) {
                next();
            } else {
                throw new ApiError(403, "You are not allowed to do this action!!");
            }
        } catch (error) {
            next(new ApiError(403, "You are not allowed to do this action!"));
        }
    };
};


export {checkRole};