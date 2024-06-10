"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adminservice_1 = require("../services/adminservice");
const authservice_1 = require("../services/authservice");
const adminController = {
    getIgPostRequests: async (req, res) => {
        try {
            const adminService = new adminservice_1.AdminService();
            return res.status(200).json(await adminService.getIgPostRequests(req));
        }
        catch (error) {
            return res.status(400).json({ status: false, error: error });
        }
    },
    pushIgPostRequest: async (req, res) => {
        try {
            const adminService = new adminservice_1.AdminService();
            const resp = await adminService.pushIgPostRequest(req);
            console.log("Upload Response ===> ", resp);
            if (resp == 190) {
                return res.redirect('/');
            }
            return res.status(200).json(resp);
        }
        catch (error) {
            return res.status(400).json({ status: false, error: error });
        }
    },
    toggleUserAdminStatus: async (req, res, next) => {
        try {
            let status = 400;
            const authentication = new authservice_1.Authentication(req);
            const result = await authentication.toggleUserAdminStatus();
            if (result)
                status = 200;
            res.status(status).json(result);
        }
        catch (error) {
            error.status = 422;
            next(error);
        }
    },
};
exports.default = adminController;
