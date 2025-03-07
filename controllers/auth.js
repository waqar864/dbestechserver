const {validationResult} = require('express-validator');
const { User } = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Token } = require('../models/token');
const mailSender = require('../helpers/email_sender');
exports.register = async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
            field: error.path,
            message: error.msg,
        }));
        return res.status(400).json({ errors: errorMessages });
    }

    try {
        let user = new User({
            ...req.body,
            passwordHash: bcrypt.hashSync(req.body.password, 8),

        });
        user = await user.save();
        if (!user) {
            return res.status(500).json({
                type: "Internal Server Error", 
                message: "Could not Create a new User" });
        }
        return res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        if(error.message.includes('email_1 dup key')) {
            return res.status(409).json({ message: "Email already exists" });
        }
        return res.status(500).json({ type:error.name, message: error.message });
    }
}

exports.login = async function(req, res) {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (!user) {
            return res.status(404).json({ message: "User not found \n Check your email and try again" });
        }
        const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(404).json({ message: "Incorrect password" });
        }
        const accessToken = jwt.sign(
            {id: user.id, isAdmin: user.isAdmin},
            process.env.ACCESS_TOKEN_SECRET,{
                expiresIn: "24h",
            }
        );
        const refreshToken = jwt.sign(
            {id: user.id, isAdmin: user.isAdmin},
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: "60d",
            }
        );
        const token = await Token.findOne({userId: user.id});
        if(token) await token.deleteOne();

        await new Token({
            userId: user.id,
            accessToken,
            refreshToken,
        }).save();

        user.passwordHash = undefined;

        return res.json({...user._doc, accessToken});
    } catch (error) {
        return res.status(500).json({ type:error.name, message: error.message });
    }
}
exports.verifyToken = async function(req, res) {
    try {
        const accessToken = req.headers.authorization;
        if (!accessToken) return res.json(false);
        accessToken = accessToken.replace("Bearer ","").trim();
        const token = await Token.findOne({accessToken});
        if (!token) return res.json(false);

        const tokenData = jwt.decode(token.refreshToken);
        const user = await User.findById(tokenData.id);
        if (!user) return res.json(false);
        const isValid = jwt.verify(token.refreshToken, process.env.REFRESH_TOKEN_SECRET);
        if (!isValid) return res.json(false);
        return res.json(true);
        
    } catch (error) {
        return res.status(500).json({ type:error.name, message: error.message });
    }
}

exports.forgotPassword = async function(req, res) {
    try {
        const {email} = req.body;

        const user = await User.findOne({email});
        if (!user) {
            return res.status(404).json({ message: "User not found \n Check your email and try again" });
        }
        const otp = Math.floor(1000 + Math.random() * 9000);
        user.resetPasswordotp = otp;
        user.resetPasswordotpExpires = Date.now() + 600000; // 10 min   
        await user.save();
        const response = await mailSender.sendMail(
            email,
            'Password Reset OTP',
            `Your OTP for password reset is: ${otp}`
        );
        return res.status(500).json({ message: response });
       
    } catch (error) {
        return res.status(500).json({ type:error.name, message: error.message });
    }
}

exports.verifyPasswordResetOTP = async function(req, res) {
    try {
        const {email, otp} = req.body;

        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({ message: "User not found \n Check your email and try again" });
        }
        if(user.resetPasswordotp !== +otp || Date.now() > user.resetPasswordotpExpires){
            return res.status(401).json({ message: "Invalid or expired OTP" });

        }
        user.resetPasswordotp = 1;
        user.resetPasswordotpExpires = undefined;
        
        await user.save();
        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        console.log(error); 
        return res.status(500).json({ type:error.name, message: error.message });
    }
}

exports.resetPassword = async function(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => ({
            field: error.path,
            message: error.msg,
        }));
        return res.status(400).json({ errors: errorMessages });
    }
     try {
        const {email, newPassword} = req.body;
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({ message: "User not found!"});
        }
        if(user.resetPasswordotp !== 1){
            return res.status(401).json({message: 'Confirm OTP before reseting password'});
        }
            user.passwordHash = bcrypt.hashSync(newPassword, 8);
            user.resetPasswordotp = undefined;
            await user.save();
            return res.status(200).json({ message: "Password reset successfully" });
        
     } catch (error) {
        console.log(error);
        return res.status(500).json({ type:error.name, message: error.message });
     }
    
}