
// const Joi = require('@hapi/joi')

// const schema = Joi.object({
//     name : Joi.string().required(),
//     email : Joi.string().email().required(),
//     username : Joi.string().required(),
//     password : Joi.string()
//     .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\|,.<>\\/?]).{8,}$'))
//     .message('The password does not match our password rules')
//     .required()
    
//     ,

// })


// const loginSchema = Joi.object({
//     username : Joi.string().required(),
//     password : Joi.string()
//     .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\|,.<>\\/?]).{8,}$'))
//     .message('The password does not match our password rules')
//     .required()
// })

// module.exports = {schema,loginSchema};

const Joi = require('@hapi/joi')

const schema = Joi.object({
    name : Joi.string().required(),
    email : Joi.string().email().required(),
    username : Joi.string().required(),
    password : Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\|,.<>\\/?]).{8,}$'))
    .message('The password does not match our password rules')
    .required(),
    phone: Joi.string().allow(null, ''), 
    address: Joi.string().allow(null, ''),
    profilePictureUrl: Joi.string().allow(null, ''), 
})


const loginSchema = Joi.object({
    username : Joi.string().required(),
    password : Joi.string()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\|,.<>\\/?]).{8,}$'))
    .message('The password does not match our password rules')
    .required()
})

module.exports = {schema,loginSchema};