import axios from "axios";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from 'dotenv';

dotenv.config()
/**
 * Hàm này thực hiện gửi yêu cầu lấy Google OAuth token dựa trên authorization code nhận được từ client-side.
 * @param {string} code - Authorization code được gửi từ client-side.
 * @returns {Object} - Đối tượng chứa Google OAuth token.
 */
export const handleLoginGoogle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    const data = await getOauthGooleToken(code as string); // Gửi authorization code để lấy Google OAuth token
    const { id_token, access_token } = data; // Lấy ID token và access token từ kết quả trả về
    const googleUser = await getGoogleUser({ id_token, access_token }); // Gửi Google OAuth token để lấy thông tin người dùng từ Google
    console.log("googleUser", googleUser);
    // Kiểm tra email đã được xác minh từ Google
    if (!googleUser.verified_email) {
      return res.status(403).json({
        message: 'Google email not verified'
      });
    }

    // Tạo manual_access_token và manual_refresh_token sử dụng JWT (JSON Web Token)
    const manual_access_token = jwt.sign(
      { email: googleUser.email, type: 'access_token' },
      process.env.AC_PRIVATE_KEY as string,
      { expiresIn: '15m' }
    );
    const manual_refresh_token = jwt.sign(
      { email: googleUser.email, type: 'refresh_token' },
      process.env.RF_PRIVATE_KEY as string,
      { expiresIn: '100d' }
    );

    // Redirect người dùng về trang login với access token và refresh token
    return res.redirect(
      `http://localhost:3000/login?access_token=${manual_access_token}&refresh_token=${manual_refresh_token}`
    );
  } catch (error) {
    next(error);
  }
};

export const getOauthGooleToken = async (code: string) => {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID as string,
    client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
    redirect_uri: process.env.GOOGLE_AUTHORIZED_REDIRECT_URI as string,
    grant_type: 'authorization_code'
  });
  console.log("body", body)
  const { data } = await axios.post(
    'https://oauth2.googleapis.com/token',
    body.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  );
  return data;
};

/**
 * Hàm này thực hiện gửi yêu cầu lấy thông tin người dùng từ Google dựa trên Google OAuth token.
 * @param {Object} tokens - Đối tượng chứa Google OAuth token.
 * @param {string} tokens.id_token - ID token được lấy từ Google OAuth.
 * @param {string} tokens.access_token - Access token được lấy từ Google OAuth.
 * @returns {Object} - Đối tượng chứa thông tin người dùng từ Google.
 */
export const getGoogleUser = async ({ id_token, access_token }: { id_token: string, access_token: string }) => {
  const { data } = await axios.get(
    'https://www.googleapis.com/oauth2/v1/userinfo',
    {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    }
  );
  return data;
};
