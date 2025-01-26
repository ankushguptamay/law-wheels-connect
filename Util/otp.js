const otpGenerator = require("otp-generator");
const axios = require("axios");
const {
  SMS_ROUTE_ID,
  SMS_CHANNEL,
  SMS_API_KEY,
  SMS_SENDER_ID,
  SMS_DLT_ENTITY_ID,
  SMS_DLT_TEMPLATE_ID,
} = process.env;

function generateFixedLengthRandomNumber(numberOfDigits) {
  return otpGenerator.generate(numberOfDigits, {
    lowerCaseAlphabets: false,
    upperCaseAlphabets: false,
    specialChars: false,
  });
}

const sendOTPToMoblie = async (phoneNumber, otp) => {
  try {
    const message = `${otp} is your login OTP for Law Wheels App. Do not share it with anyone.`;
    console.log(message)
    let response = await axios.post(
      `https://www.smsgatewayhub.com/api/mt/SendSMS?APIKey=${SMS_API_KEY}&senderid=${SMS_SENDER_ID}&channel=${SMS_CHANNEL}&DCS=0&flashsms=0&number=${phoneNumber}&text=${message}&route=${SMS_ROUTE_ID}&EntityId=${SMS_DLT_ENTITY_ID}&dlttemplateid=${SMS_DLT_TEMPLATE_ID}`
    );
    // console.log(response);
    return response;
  } catch (e) {
    console.log("Something went wrong in sending SMS: ", e);
  }
};

module.exports = { generateFixedLengthRandomNumber, sendOTPToMoblie };
