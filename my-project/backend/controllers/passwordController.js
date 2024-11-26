const Employee = require('../models/Employee'); 
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

const forgotPassword = async (req, res) => {
    const { employee_email } = req.body; 

    try {
        const employee = await Employee.findOne({ employee_email });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const token = jwt.sign({ id: employee._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const transporter = nodemailer.createTransport({
            service: 'gmail', 
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS,  
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: employee_email,
            subject: 'Password Reset',
            text: `You requested a password reset. Here is your token: ${token}`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Reset link sent to your email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports = { forgotPassword };
