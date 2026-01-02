import ApiErrors from "../helpers/ApiErrors.js";
import AsyncHandler from "../helpers/AsyncHandler.js";
import { check, validationResult } from 'express-validator'
import Users from "../models/Users.model.js";
import bcrypt from 'bcryptjs'
import { generatePasswordResetMail, generateVerificationMail, sendBrevoMail } from "../config/mail.js";
import TempUsers from "../models/TempUsers.model.js";
import ApiResponse from "../helpers/ApiResponse.js";
import generateToken from "../utils/token.js";

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

export const verifyRegi = AsyncHandler(async (req, res) => {
    const { email, otp } = req.body
    if (!email) {
        throw new ApiErrors(400, 'email are required')
    }

    const tempUser = await TempUsers.findOne({ email })
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

export const login = AsyncHandler(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        throw new ApiErrors(400, 'all field are required')
    }

    const user = await Users.findOne({ email })
    if (!user) {
        throw new ApiErrors(404, 'user not registered')
    }

    const matchedPass = await bcrypt.compare(password, user.password)
    if (!matchedPass) {
        throw new ApiErrors(400, 'password is not matched')
    }

    user.password = undefined

    const token = generateToken(user._id)

    const tokenOption = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 10 * 24 * 60 * 60 * 1000
    }

    return res
        .status(200)
        .cookie('token', token, tokenOption)
        .json(
            new ApiResponse(200, user, 'user loggedIn successfully')
        )
})

export const logOut = AsyncHandler(async (req, res) => {
    const tokenOption = {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 10 * 24 * 60 * 60 * 1000
    }

    return res
        .status(200)
        .clearCookie('token', tokenOption)
        .json(
            new ApiResponse(200, {}, 'user loggedIn successfully')
        )
})

export const forgetPass = AsyncHandler(async (req, res) => {
    const { email } = req.body
    if (!email) {
        throw new ApiErrors(400, 'email is required')
    }

    const user = await Users.findOne({ email })
    if (!user) {
        throw new ApiErrors(404, 'user is not registered')
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiredOtp = Date.now() + 5 * 60 * 1000

    await TempUsers.findOneAndUpdate(
        { email },
        { otp, expiredOtp },
        { new: true, upsert: true }
    )

    const { subject, html } = generatePasswordResetMail(otp)

    await sendBrevoMail(email, subject, html)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'otp sended successfully')
        )
})

export const verifyForgetPass = AsyncHandler(async (req, res) => {
    const { email, otp } = req.body
    if (!email) {
        throw new ApiErrors('email is required')
    }

    const tempUser = await TempUsers.findOne({ email })
    if (!tempUser) {
        throw new ApiErrors(404, 'user is not found in temp user')
    }

    if (tempUser.otp !== otp) {
        throw new ApiErrors(400, 'otp is not matched')
    }

    if (tempUser.expiredOtp < Date.now()) {
        throw new ApiErrors(400, 'otp is expired')
    }

    tempUser.isVerified = true
    await tempUser.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'email verified successfully')
        )
})

export const resetPass = [
    check('password')
        .trim()
        .isLength({ min: 8 })
        .withMessage('password must be at least 8 characters')
        .matches(/[a-zA-Z]/)
        .withMessage('password must contain a letter')
        .matches(/[0-9]/)
        .withMessage('password must contain a number'),

    AsyncHandler(async (req, res) => {
        const { email, password } = req.body
        const error = validationResult(req)

        if (!error.isEmpty()) {
            throw new ApiErrors(400, 'entered wrong value', error.array())
        }

        const tempUser = await TempUsers.findOne({ email })
        if (!tempUser) {
            throw new ApiErrors(404, 'temp user is not found')
        }

        if (!tempUser.isVerified) {
            throw new ApiErrors(401, 'unauthorize access')
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        await Users.findOneAndUpdate(
            { email },
            { password: hashedPassword },
            { new: true }
        )

        await tempUser.deleteOne()

        return res
            .status(200)
            .json(
                new ApiResponse(200, {}, 'password reset successfully')
            )
    })
]

export const resendOtp = AsyncHandler(async (req, res) => {
    const { email, mode } = req.body
    if (!email || !mode) {
        throw new ApiErrors(400, 'email and mode are required')
    }

    const tempUser = await TempUsers.findOne({ email })

    if (!tempUser) {
        throw new ApiErrors(404, 'time expired try again')
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiredOtp = Date.now() + 5 * 60 * 1000

    tempUser.otp = otp
    tempUser.expiredOtp = expiredOtp

    let subject, html

    if (mode === 'register') {
        ({subject, html} = generateVerificationMail(otp))
    } else if (mode === 'resetPass') {
        ({subject, html} = generatePasswordResetMail(otp))
    }

    await tempUser.save()
    await sendBrevoMail(email, subject, html)

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'reset otp successfully')
        )
})