const express = require("express");
const router = express.Router();

router.post("/login", (req, res) => {
    return res.status(201).json({name:'waqar', age: 22});
});

router.post("/register", (req, res) => {
    //validate the user
    
});

router.post('/forgot-password',(req,res)=>{});

router.post('/verify-otp',(req,res)=>{});

router.post('/reset-password',(req,res)=>{});

module.exports = router;
