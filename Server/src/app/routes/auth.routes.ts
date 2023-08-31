import express from "express"
import {handleLoginGoogle } from "../controllers/authGoogle.controller";

const routerGoogle = express.Router();

/**
 * Định nghĩa endpoint '/api/oauth/google' để xử lý quá trình xác thực OAuth với Google.
 * Endpoint này sẽ được gọi từ client-side sau khi người dùng đăng nhập thành công với Google và nhận được authorization code.
 */
routerGoogle.get('/oauth/google', handleLoginGoogle)

export default routerGoogle