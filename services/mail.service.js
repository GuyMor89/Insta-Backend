import { Resend } from 'resend'

import dotenv from 'dotenv'
dotenv.config()

const resend = new Resend(process.env.RESEND_API)

export function sendMail(mailDetails) {

    const mailToSend = {
        ...mailDetails,
        from: 'instabit@resend.dev',
        to: "guymor89@gmail.com"
    }

    resend.emails.send(mailToSend)
}

// const transporter = NodeMailer.createTransport({
//     host: "mail.gmx.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.EMAIL,
//         pass: process.env.EMAIL_PASS,
//     },
//     logger: true,
//     debug: true
// })

// export function sendMail(mailOptions) {

//     transporter.sendMail(mailToSend, (error, info) => {
//         if (error) {
//             console.log("Error:", error)
//         } else {
//             console.log("Email sent:", info.response)
//         }
//     })
// }

