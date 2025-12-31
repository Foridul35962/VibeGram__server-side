import ApiErrors from "../helpers/ApiErrors.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import { check, validationResult } from 'express-validator'
import Users from "../models/Users.model.js";
import bcrypt from 'bcryptjs'
import { generateVerificationMail, sendBrevoMail } from "../config/mail.js";
import TempUsers from "../models/TempUsers.model.js";
import ApiResponse from "../helpers/ApiResponse.js";

export const registration = [
    check('fullName')
        .notEmpty()
        .withMessage('full name is required'),
    check('userName')
        .trim()
        .notEmpty()
        .withMessage('user name is required'),
    check('email')
        .trim()
        .isEmail()
        .withMessage('enter a valid email'),
    check('password')
        .trim()
        .isLength({ min: 8 })
        .withMessage('password must be at least 8 characters')
        .matches(/[a-zA-Z]/)
        .withMessage('password must contain a letter')
        .matches(/[0-9]/)
        .withMessage('password must contain a number'),

    AsyncHandler(async (req, res) => {
        const { fullName, userName, email, password } = req.body

        const error = validationResult(req)
        if (!error.isEmpty()) {
            throw new ApiErrors(400, 'entered wrong value', error.array())
        }

        const dublicateEmail = await Users.findOne({ email })
        if (dublicateEmail) {
            throw new ApiErrors(400, 'email is already registered')
        }

        const dublicateUserName = await Users.findOne({ userName })
        if (dublicateUserName) {
            throw new ApiErrors(400, 'user name already used')
        }

        const hashedPassword = await bcrypt.hash(password, 12)
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const expiredOtp = Date.now() + 5 * 60 * 1000

        await TempUsers.findOneAndUpdate(
            { email },
            { fullName, userName, password: hashedPassword, otp, expiredOtp },
            { new: true, upsert: true }
        )

        const { subject, html } = generateVerificationMail(otp)
        await sendBrevoMail(email, subject, html)

        return res
            .status(201)
            .json(
                new ApiResponse(201, {}, 'otp send successfully')
            )
    })
]

export const verifyRegi = AsyncHandler(async(req, res)=>{
    const {email, otp} = req.body
    if (!email) {
        throw new ApiErrors(400, 'email are required')
    }

    const tempUser = await TempUsers.findOne({email})
    if (!tempUser) {
        throw new ApiErrors(404, 'user is saved in our database')
    }

    if (tempUser.otp !== otp || otp === '') {
        throw new ApiErrors('otp is not matched')
    }

    if (tempUser.expiredOtp < Date.now()) {
        throw new ApiErrors('otp is expired')
    }

    await Users.create({
        fullName: tempUser.fullName,
        userName: tempUser.userName,
        email: tempUser.email,
        password: tempUser.password
    })

    await tempUser.deleteOne()

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'registration successfully')
        )
})