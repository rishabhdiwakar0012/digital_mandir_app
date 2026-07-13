export const REGISTER_CONFIG = {
    title: "Create your account",
    subtitle: "अकाउंट बनायें",

    placeholders: {
        firstName: "First Name",
        lastName: "Last Name",
        gender: "Gender",
        age: "Age",
        phone: "Enter Phone Number",
        otp: "Enter 6 digit OTP"
    },

    genderOptions: [
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" }
    ],

    buttons: {
        sendOtp: "SEND OTP",
        continue: "CONTINUE",
        next: "NEXT"
    },

    otpResendText: "Resend OTP",
    resendTimer: 30,

    illustrationSize: {
        width: 160,
        height: 210
    }
};
