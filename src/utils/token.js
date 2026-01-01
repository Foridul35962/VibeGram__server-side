import jwt from 'jsonwebtoken'

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        process.env.TOKEN_SECRET,
        { expiresIn: process.env.TOKEN_EXPIRY }
    )
}

export default generateToken