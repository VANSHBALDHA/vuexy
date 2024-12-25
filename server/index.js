const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const { ObjectId } = require('mongodb')

const bcrypt = require('bcryptjs')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const moment = require('moment')

const swaggerJsDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')

const Users = require('./Models/data')
const LeadData = require('./Models/item')
const CustomerData = require('./Models/customer')
const UsersData = require('./Models/user')
const UserRegister = require('./Models/registeruser')

const app = express()

const corsOptions = {
  origin: 'http://localhost:3001',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))
app.use(express.json())

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API List',
      version: '1.0.0',
      description: 'API Managements'
    },
    servers: [
      {
        url: 'http://localhost:3001'
      }
    ]
  },
  apis: ['./index.js']
}

const swaggerSpec = swaggerJsDoc(swaggerOptions)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

mongoose.connect('mongodb://127.0.0.1:27017/vuexy')

/**
 *  @swagger
 *  tags:
 *      - name: Authorization
 *        description: The Users Authorization API
 *
 * /register:
 *  post:
 *      tags:
 *          - Authorization
 *      summary: User registration
 *      description: Allows a new user to register by providing necessary details such as username, email, password, and confirm-password.
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          username:
 *                              type: string
 *                          email:
 *                              type: string
 *                          password:
 *                              type: string
 *                          confirmPassword:
 *                              type: string
 *      responses:
 *          201:
 *              description: User registered successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: "User registered successfully"
 *          400:
 *              description: Invalid input data or password mismatch
 *          500:
 *              description: Internal server error
 */
app.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }

    const existingUser = await UserRegister.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new UserRegister({
      username,
      email,
      password: hashedPassword
    })

    await newUser.save()

    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: 'your-email@gmail.com',
    //     pass: 'your-email-password'
    //   }
    // })

    // const mailOptions = {
    //   from: 'your-email@gmail.com',
    //   to: email,
    //   subject: 'Welcome to Vuexy',
    //   text: `Hello ${username},\n\nWelcome to Vuexy! We're excited to have you on board.\n\nBest regards,\nVuexy Team`
    // }

    // await transporter.sendMail(mailOptions)

    res.status(201).json({ message: 'User registered successfully', status: true, newUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error', status: false })
  }
})

/**
 *  @swagger
 *  tags:
 *      - name: Authorization
 *        description: The Users Authorization API
 *
 * /login:
 *  post:
 *      tags:
 *          - Authorization
 *      summary: User login
 *      description: Allows a user to log in using either their username or email and password.
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          usernameOrEmail:
 *                              type: string
 *                              description: Username or email of the user
 *                          password:
 *                              type: string
 *                              description: User's password
 *      responses:
 *          200:
 *              description: User logged in successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: "User logged in successfully"
 *                              token:
 *                                  type: string
 *                                  description: Authentication token for the session
 *          400:
 *              description: Invalid login credentials
 *          500:
 *              description: Internal server error
 */
// app.post('/login', async (req, res) => {
//   const { usernameOrEmail, password } = req.body

//   try {
//     const user = await UserRegister.findOne({
//       $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
//     })

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid login credentials' })
//     }

//     const isMatch = await bcrypt.compare(password, user.password)

//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid login credentials' })
//     }

//     const token = jwt.sign({ userId: user._id, username: user.username, email: user.email }, 'your_jwt_secret', {
//       expiresIn: '1h'
//     })

//     res.status(200).json({
//       message: 'User logged in successfully',
//       token: token
//     })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: 'Internal server error' })
//   }
// })

app.post('/login', async (req, res) => {
  const { usernameOrEmail, password } = req.body

  try {
    const user = await UserRegister.findOne({
      $or: [{ email: usernameOrEmail }, { username: usernameOrEmail }]
    })

    if (!user) {
      return res.status(400).json({ message: 'Invalid login credentials' })
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid login credentials' })
    }

    user.lastLogin = moment().format()
    user.loginCount = (user.loginCount || 0) + 1

    await user.save()

    res.status(200).json({ message: 'User logged in successfully' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 *  @swagger
 *  tags:
 *      - name: Authorization
 *        description: The Users Authorization API
 *
 * /forgot-password:
 *  post:
 *      tags:
 *          - Authorization
 *      summary: Forgot password
 *      description: Allows a user to request a password reset by providing their email address.
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          email:
 *                              type: string
 *                              description: Email address of the user
 *      responses:
 *          200:
 *              description: Password reset link sent to the email
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: "Password reset link sent to your email"
 *          400:
 *              description: Invalid email address
 *          500:
 *              description: Internal server error
 */

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body

  try {
    const user = await UserRegister.findOne({ email })

    if (!user) {
      return res.status(400).json({ message: 'Invalid email address' })
    }

    const resetToken = crypto.randomBytes(32).toString('hex')

    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    user.resetPasswordExpire = Date.now() + 3600000
    await user.save()

    const resetUrl = `http://localhost:3000/reset-password/${resetToken}`

    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: 'your-email@gmail.com',
    //     pass: 'your-email-password'
    //   }
    // })

    // const mailOptions = {
    //   from: 'your-email@gmail.com',
    //   to: user.email,
    //   subject: 'Password Reset Request',
    //   text: `You requested a password reset. Click the link below to reset your password:\n\n${resetUrl}`
    // }

    // await transporter.sendMail(mailOptions)

    res.status(200).json({ message: 'Password reset link sent to your email' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  }
})

/**
 *  @swagger
 *  tags:
 *      - name: Authorization
 *        description: The Users Authorization API
 *
 * /reset-password:
 *  post:
 *      tags:
 *          - Authorization
 *      summary: Reset user password
 *      description: Allows a user to reset their password by providing a new password and confirming it.
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          password:
 *                              type: string
 *                              description: New password for the user
 *                          confirmPassword:
 *                              type: string
 *                              description: Confirm the new password
 *      responses:
 *          200:
 *              description: Password reset successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: "Password reset successfully"
 *          400:
 *              description: Password mismatch or invalid input data
 *          500:
 *              description: Internal server error
 */

// app.post('/reset-password', async (req, res) => {
//   const { resetToken, password, confirmPassword } = req.body

//   try {
//     if (password !== confirmPassword) {
//       return res.status(400).json({ message: 'Passwords do not match' })
//     }

//     const user = await UserRegister.findOne({ resetPasswordToken: resetToken })

//     if (!user || Date.now() > user.resetPasswordExpire) {
//       return res.status(400).json({ message: 'Invalid or expired token' })
//     }

//     const hashedPassword = await bcrypt.hash(password, 10)

//     user.password = hashedPassword
//     user.resetPasswordToken = undefined
//     user.resetPasswordExpire = undefined

//     await user.save()

//     res.status(200).json({ message: 'Password reset successfully' })
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: 'Internal server error' })
//   }
// })

app.post('/reset-password', async (req, res) => {
  const { email, password, confirmPassword } = req.body

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' })
    }

    const user = await UserRegister.findOne({ email })

    if (!user) {
      return res.status(400).json({ message: 'No user found with this email' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    user.password = hashedPassword

    await user.save()

    res.status(200).json({ message: 'Password reset successfully', success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Internal server error', success: false })
  }
})

/**
 *  @swagger
 *  tags:
 *      - name: Leads
 *        description: Operations related to lead management
 *
 * /leads-list:
 *  get:
 *      tags:
 *          - Leads
 *      summary: Lead List
 *      discription: Retrieves a list of all leads
 *      operationId: Lead/LeadList
 *      responses:
 *            200:
 *                description: Leads fetched successfully.
 */
app.get('/leads-list', (req, res) => {
  LeadData.find()
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 * /Leads:
 *  post:
 *      tags:
 *          - Leads
 *      summary: Add a new Lead
 *      description: Create a new lead.
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          number_asked:
 *                              type: integer
 *                              example: 10
 *                          fullName:
 *                              type: string
 *                              example: Jane Doe
 *                          email:
 *                              type: string
 *                              example: jane.doe@example.com
 *                          password:
 *                              type: string
 *                              example: password123
 *                          plan_type:
 *                              type: string
 *                              example: premium
 *                          number_type:
 *                              type: string
 *                              example: toll-free
 *                          toll_free_no:
 *                              type: integer
 *                              example: 12345
 *                          local_no:
 *                              type: integer
 *                              example: 54321
 *                          current_no:
 *                              type: string
 *                              example: 1234567890
 *                          price:
 *                              type: number
 *                              example: 99.99
 *                          address:
 *                              type: string
 *                              example: 123 Main St
 *                          state:
 *                              type: string
 *                              example: California
 *                          city:
 *                              type: string
 *                              example: Los Angeles
 *                          zip_code:
 *                              type: string
 *                              example: 90001
 *                          temp:
 *                              type: boolean
 *                              example: true
 *                          no_of_users:
 *                              type: integer
 *                              example: 50
 *                          status:
 *                              type: string
 *                              example: active
 *      responses:
 *          201:
 *              description: Lead created successfully.
 */
app.post('/Leads', (req, res) => {
  const {
    number_asked,
    fullName,
    email,
    password,
    plan_type,
    number_type,
    toll_free_no,
    local_no,
    current_no,
    price,
    address,
    state,
    city,
    zip_code,
    temp,
    no_of_users,
    status
  } = req.body
  LeadData.create({
    number_asked: number_asked,
    fullName: fullName,
    email: email,
    password: password,
    plan_type: plan_type,
    number_type: number_type,
    toll_free_no: toll_free_no ? toll_free_no : 0,
    local_no: local_no ? local_no : 0,
    current_no: current_no,
    price: price,
    address: address,
    state: state,
    city: city,
    zip_code: zip_code,
    temp: temp,
    no_of_users: no_of_users,
    status: status
  })
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 * /get-lead/{id}:
 *  get:
 *      tags:
 *          - Leads
 *      summary: Get Lead by ID
 *      description: Retrieve the details of a lead by ID.
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Lead ID to retrieve.
 *            schema:
 *                type: string
 *      responses:
 *          200:
 *              description: Lead retrieved successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: "Lead retrieved successfully"
 *                              data:
 *                                  type: object
 *                                  properties:
 *                                      number_asked:
 *                                          type: integer
 *                                          example: 10
 *                                      status:
 *                                          type: string
 *                                          example: inactive
 *                                      fullName:
 *                                          type: string
 *                                          example: Jane Doe
 *                                      email:
 *                                          type: string
 *                                          example: jane.doe@example.com
 *                                      password:
 *                                          type: string
 *                                          example: newpassword123
 *                                      plan_type:
 *                                          type: string
 *                                          example: standard
 *                                      number_type:
 *                                          type: string
 *                                          example: local
 *                                      toll_free_no:
 *                                          type: integer
 *                                          example: 12345
 *                                      local_no:
 *                                          type: integer
 *                                          example: 54321
 *                                      current_no:
 *                                          type: string
 *                                          example: 1234567890
 *                                      price:
 *                                          type: number
 *                                          example: 49.99
 *                                      address:
 *                                          type: string
 *                                          example: 456 Elm St
 *                                      state:
 *                                          type: string
 *                                          example: Texas
 *                                      city:
 *                                          type: string
 *                                          example: Dallas
 *                                      zip_code:
 *                                          type: string
 *                                          example: 75001
 *                                      temp:
 *                                          type: boolean
 *                                          example: true
 *                                      no_of_users:
 *                                          type: integer
 *                                          example: 20
 *          400:
 *              description: Invalid ID format
 *          404:
 *              description: Lead not found
 */
app.get('/get-lead/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' })
    }

    const lead = await LeadData.findById(req.params.id)

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' })
    }

    return res.json({
      status: true,
      message: 'Lead retrieved successfully',
      data: lead
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'An error occurred while retrieving the lead data' })
  }
})

/**
 *  @swagger
 * /edit-list/{id}:
 *  put:
 *      tags:
 *          - Leads
 *      summary: Update Lead
 *      description: Update an existing lead's details by ID
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Lead ID to update.
 *            schema:
 *                type: string
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          number_asked:
 *                              type: integer
 *                              example: 10
 *                          status:
 *                              type: string
 *                              example: inactive
 *                          fullName:
 *                              type: string
 *                              example: Jane Doe
 *                          email:
 *                              type: string
 *                              example: jane.doe@example.com
 *                          password:
 *                              type: string
 *                              example: newpassword123
 *                          plan_type:
 *                              type: string
 *                              example: standard
 *                          number_type:
 *                              type: string
 *                              example: local
 *                          toll_free_no:
 *                              type: integer
 *                              example: 12345
 *                          local_no:
 *                              type: integer
 *                              example: 54321
 *                          current_no:
 *                              type: string
 *                              example: 1234567890
 *                          price:
 *                              type: number
 *                              example: 49.99
 *                          address:
 *                              type: string
 *                              example: 456 Elm St
 *                          state:
 *                              type: string
 *                              example: Texas
 *                          city:
 *                              type: string
 *                              example: Dallas
 *                          zip_code:
 *                              type: string
 *                              example: 75001
 *                          temp:
 *                              type: boolean
 *                              example: true
 *                          no_of_users:
 *                              type: integer
 *                              example: 20
 *      responses:
 *          200:
 *              description: Lead updated successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              message:
 *                                  type: string
 *                                  example: "Lead updated successfully"
 *                              data:
 *                                  type: object
 *                                  properties:
 *                                      number_asked:
 *                                          type: integer
 *                                          example: 10
 *                                      status:
 *                                          type: string
 *                                          example: inactive
 *                                      fullName:
 *                                          type: string
 *                                          example: Jane Doe
 *                                      email:
 *                                          type: string
 *                                          example: jane.doe@example.com
 *                                      password:
 *                                          type: string
 *                                          example: newpassword123
 *                                      plan_type:
 *                                          type: string
 *                                          example: standard
 *                                      number_type:
 *                                          type: string
 *                                          example: local
 *                                      toll_free_no:
 *                                          type: integer
 *                                          example: 12345
 *                                      local_no:
 *                                          type: integer
 *                                          example: 54321
 *                                      current_no:
 *                                          type: string
 *                                          example: 1234567890
 *                                      price:
 *                                          type: number
 *                                          example: 49.99
 *                                      address:
 *                                          type: string
 *                                          example: 456 Elm St
 *                                      state:
 *                                          type: string
 *                                          example: Texas
 *                                      city:
 *                                          type: string
 *                                          example: Dallas
 *                                      zip_code:
 *                                          type: string
 *                                          example: 75001
 *                                      temp:
 *                                          type: boolean
 *                                          example: true
 *                                      no_of_users:
 *                                          type: integer
 *                                          example: 20
 *          400:
 *              description: Invalid ID or missing parameters
 *          404:
 *              description: Lead not found
 */
app.put('/edit-list/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' })
    }

    await LeadData.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          number_asked: req.body.number_asked,
          status: req.body.status,
          fullName: req.body.fullName,
          email: req.body.email,
          password: req.body.password,
          plan_type: req.body.plan_type,
          number_type: req.body.number_type,
          toll_free_no: req.body.toll_free_no ? req.body.toll_free_no : 0,
          local_no: req.body.local_no ? req.body.local_no : 0,
          current_no: req.body.current_no,
          price: req.body.price,
          address: req.body.address,
          state: req.body.state,
          city: req.body.city,
          zip_code: req.body.zip_code,
          temp: req.body.temp,
          no_of_users: req.body.no_of_users
        }
      }
    )

    const data = await LeadData.findById(req.params.id)

    return res.json({
      status: true,
      message: 'Leads updated successfully',
      result: {
        id: data._id
      }
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'An error occurred while updating leads data' })
  }
})

/**
 *  @swagger
 * /delete-list/{id}:
 *  delete:
 *      tags:
 *          - Leads
 *      summary: Delete a Lead
 *      description: Deletes a lead by ID.
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Lead ID to delete.
 *            schema:
 *                type: string
 *      responses:
 *          200:
 *              description: Lead deleted successfully.
 *          404:
 *              description: Lead not found.
 */
app.delete('/delete-list/:id', (req, res) => {
  const { id } = req.params
  LeadData.findByIdAndDelete({ _id: id })
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 *  tags:
 *      - name: Customers
 *        description: Operations related to customer management
 *
 * /customers-list:
 *  get:
 *      tags:
 *          - Customers
 *      summary: Customer List
 *      description: Fetches a list of all customers.
 *      responses:
 *            200:
 *                description: Customers fetched successfully.
 */
app.get('/customers-list', (req, res) => {
  CustomerData.find()
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 * /customers:
 *  post:
 *      tags:
 *          - Customers
 *      summary: Add a New Customer
 *      description: Creates a new customer record.
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          number_asked:
 *                              type: integer
 *                              example: 5
 *                          fullName:
 *                              type: string
 *                              example: John Doe
 *                          email:
 *                              type: string
 *                              example: john.doe@example.com
 *                          password:
 *                              type: string
 *                              example: pass1234
 *                          plan_type:
 *                              type: string
 *                              example: premium
 *                          number_type:
 *                              type: string
 *                              example: toll-free
 *                          toll_free_no:
 *                              type: integer
 *                              example: 12345
 *                          local_no:
 *                              type: integer
 *                              example: 67890
 *                          current_no:
 *                              type: string
 *                              example: 9876543210
 *                          price:
 *                              type: number
 *                              example: 99.99
 *                          address:
 *                              type: string
 *                              example: 123 Main St
 *                          state:
 *                              type: string
 *                              example: California
 *                          city:
 *                              type: string
 *                              example: Los Angeles
 *                          zip_code:
 *                              type: string
 *                              example: 90001
 *                          temp:
 *                              type: boolean
 *                              example: false
 *                          no_of_users:
 *                              type: integer
 *                              example: 10
 *                          status:
 *                              type: string
 *                              example: active
 *      responses:
 *          201:
 *              description: Customer created successfully.
 *          400:
 *              description: Bad request.
 */
app.post('/customers', (req, res) => {
  const {
    number_asked,
    fullName,
    email,
    password,
    plan_type,
    number_type,
    toll_free_no,
    local_no,
    current_no,
    price,
    address,
    state,
    city,
    zip_code,
    temp,
    no_of_users,
    status
  } = req.body
  CustomerData.create({
    number_asked: number_asked,
    fullName: fullName,
    email: email,
    password: password,
    plan_type: plan_type,
    number_type: number_type,
    toll_free_no: toll_free_no ? toll_free_no : 0,
    local_no: local_no ? local_no : 0,
    current_no: current_no,
    price: price,
    address: address,
    state: state,
    city: city,
    zip_code: zip_code,
    temp: temp,
    no_of_users: no_of_users,
    status: status
  })
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 * /customers/{id}:
 *  get:
 *      tags:
 *          - Customers
 *      summary: Get Customer by ID
 *      description: Fetches details of a customer by their unique ID.
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Unique ID of the customer to fetch.
 *            schema:
 *                type: string
 *                example: 64b4cbe4d21e89001234abcd
 *      responses:
 *          200:
 *              description: Customer fetched successfully.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              number_asked:
 *                                  type: integer
 *                                  example: 10
 *                              status:
 *                                  type: string
 *                                  example: inactive
 *                              fullName:
 *                                  type: string
 *                                  example: Jane Doe
 *                              email:
 *                                  type: string
 *                                  example: jane.doe@example.com
 *                              password:
 *                                  type: string
 *                                  example: newpassword123
 *                              plan_type:
 *                                  type: string
 *                                  example: standard
 *                              number_type:
 *                                  type: string
 *                                  example: local
 *                              toll_free_no:
 *                                  type: integer
 *                                  example: 12345
 *                              local_no:
 *                                  type: integer
 *                                  example: 54321
 *                              current_no:
 *                                  type: string
 *                                  example: 1234567890
 *                              price:
 *                                  type: number
 *                                  example: 49.99
 *                              address:
 *                                  type: string
 *                                  example: 456 Elm St
 *                              state:
 *                                  type: string
 *                                  example: Texas
 *                              city:
 *                                  type: string
 *                                  example: Dallas
 *                              zip_code:
 *                                  type: string
 *                                  example: 75001
 *                              temp:
 *                                  type: boolean
 *                                  example: true
 *                              no_of_users:
 *                                  type: integer
 *                                  example: 20
 *          400:
 *              description: Invalid ID format.
 *          404:
 *              description: Customer not found.
 */
app.get('/customers/:id', async (req, res) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' })
    }
    const customer = await CustomerData.findById(id)
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' })
    }
    res.json(customer)
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error })
  }
})

/**
 *  @swagger
 * /customers-update/{id}:
 *  put:
 *      tags:
 *          - Customers
 *      summary: Update a Customer
 *      description: Updates an existing customer record by ID.
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Unique ID of the customer to update.
 *            schema:
 *                type: string
 *                example: 64b4cbe4d21e89001234abcd
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          number_asked:
 *                              type: integer
 *                              example: 10
 *                          status:
 *                              type: string
 *                              example: inactive
 *                          fullName:
 *                              type: string
 *                              example: Jane Doe
 *                          email:
 *                              type: string
 *                              example: jane.doe@example.com
 *                          password:
 *                              type: string
 *                              example: newpassword123
 *                          plan_type:
 *                              type: string
 *                              example: standard
 *                          number_type:
 *                              type: string
 *                              example: local
 *                          toll_free_no:
 *                              type: integer
 *                              example: 12345
 *                          local_no:
 *                              type: integer
 *                              example: 54321
 *                          current_no:
 *                              type: string
 *                              example: 1234567890
 *                          price:
 *                              type: number
 *                              example: 49.99
 *                          address:
 *                              type: string
 *                              example: 456 Elm St
 *                          state:
 *                              type: string
 *                              example: Texas
 *                          city:
 *                              type: string
 *                              example: Dallas
 *                          zip_code:
 *                              type: string
 *                              example: 75001
 *                          temp:
 *                              type: boolean
 *                              example: true
 *                          no_of_users:
 *                              type: integer
 *                              example: 20
 *      responses:
 *          200:
 *              description: Customer updated successfully.
 *          400:
 *              description: Invalid ID format or bad request.
 *          404:
 *              description: Customer not found.
 *          500:
 *              description: Internal server error.
 */
app.put('/customers-update/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' })
    }

    await CustomerData.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          number_asked: req.body.number_asked,
          status: req.body.status,
          fullName: req.body.fullName,
          email: req.body.email,
          password: req.body.password,
          plan_type: req.body.plan_type,
          number_type: req.body.number_type,
          toll_free_no: req.body.toll_free_no ? req.body.toll_free_no : 0,
          local_no: req.body.local_no ? req.body.local_no : 0,
          current_no: req.body.current_no,
          price: req.body.price,
          address: req.body.address,
          state: req.body.state,
          city: req.body.city,
          zip_code: req.body.zip_code,
          temp: req.body.temp,
          no_of_users: req.body.no_of_users
        }
      }
    )

    const data = await CustomerData.findById(req.params.id)

    return res.json({
      status: true,
      message: 'Customer updated successfully',
      result: {
        id: data._id
      }
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'An error occurred while updating customer data' })
  }
})

/**
 *  @swagger
 * /customers-delete/{id}:
 *  delete:
 *      tags:
 *          - Customers
 *      summary: Delete a Customer
 *      description: Deletes a customer record by ID.
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Unique ID of the customer to delete.
 *            schema:
 *                type: string
 *                example: 64b4cbe4d21e89001234abcd
 *      responses:
 *          200:
 *              description: Customer deleted successfully.
 *          400:
 *              description: Invalid ID format.
 *          404:
 *              description: Customer not found.
 *          500:
 *              description: Internal server error.
 */
app.delete('/customers-delete/:id', (req, res) => {
  const { id } = req.params
  CustomerData.findByIdAndDelete({ _id: id })
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 *  tags:
 *      - name: Users
 *        description: Operations related to user management
 *
 * /users-list:
 *  get:
 *      tags:
 *          - Users
 *      summary: User List
 *      discription: Fetched all users.
 *      responses:
 *            200:
 *                description: Users fetched successfully.
 */
app.get('/users-list', (req, res) => {
  UsersData.find()
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 * /users:
 *  post:
 *      tags:
 *          - Users
 *      summary: Create a User
 *      description: Adds a new user to the database.
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          userName:
 *                              type: string
 *                              example: John Doe
 *                          userEmail:
 *                              type: string
 *                              example: john.doe@example.com
 *                          userPassword:
 *                              type: string
 *                              example: password123
 *                          user_type:
 *                              type: string
 *                              example: admin
 *      responses:
 *          200:
 *              description: User created successfully.
 *          400:
 *              description: Invalid input.
 */
app.post('/users', (req, res) => {
  const { userName, userEmail, userPassword, user_type } = req.body
  UsersData.create({
    name: userName,
    email: userEmail,
    password: userPassword,
    user_type: user_type
  })
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 * /get-user/{id}:
 *  get:
 *      tags:
 *          - Users
 *      summary: Get User by ID
 *      description: Fetches the details of a user by their unique ID.
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Unique ID of the user to fetch.
 *            schema:
 *                type: string
 *                example: 64b4cbe4d21e89001234abcd
 *      responses:
 *          200:
 *              description: User fetched successfully.
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: object
 *                          properties:
 *                              id:
 *                                  type: string
 *                                  example: 64b4cbe4d21e89001234abcd
 *                              name:
 *                                  type: string
 *                                  example: John Doe
 *                              email:
 *                                  type: string
 *                                  example: john.doe@example.com
 *                              user_type:
 *                                  type: string
 *                                  example: admin
 *          400:
 *              description: Invalid ID format.
 *          404:
 *              description: User not found.
 *          500:
 *              description: Internal server error.
 */
app.get('/get-user/:id', async (req, res) => {
  try {
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' })
    }

    const user = await UsersData.findById(id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      user_type: user.user_type
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'An error occurred while fetching the user' })
  }
})

/**
 *  @swagger
 * /update-user/{id}:
 *  put:
 *      tags:
 *          - Users
 *      summary: Update a User
 *      description: Updates the details of an existing user by their unique ID.
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Unique ID of the user to be updated.
 *            schema:
 *                type: string
 *                example: 64b4cbe4d21e89001234abcd
 *      requestBody:
 *          required: true
 *          content:
 *              application/json:
 *                  schema:
 *                      type: object
 *                      properties:
 *                          userName:
 *                              type: string
 *                              example: Updated Name
 *                          userEmail:
 *                              type: string
 *                              example: updated.email@example.com
 *                          userPassword:
 *                              type: string
 *                              example: newpassword123
 *                          user_type:
 *                              type: string
 *                              example: admin
 *      responses:
 *          200:
 *              description: User updated successfully.
 *          400:
 *              description: Invalid ID format or bad request.
 *          404:
 *              description: User not found.
 *          500:
 *              description: Internal server error.
 */
app.put('/update-user/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid ID format' })
    }

    await UsersData.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          name: req.body.userName,
          email: req.body.userEmail,
          password: req.body.userPassword,
          user_type: req.body.user_type
        }
      }
    )

    const data = await UsersData.findById(req.params.id)

    return res.json({
      status: true,
      message: 'User updated successfully',
      result: {
        id: data._id
      }
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'An error occurred while updating leads data' })
  }
})

/**
 *  @swagger
 * /delete-user/{id}:
 *  delete:
 *      tags:
 *          - Users
 *      summary: Delete a User
 *      description: Deletes a user by their unique ID.
 *      parameters:
 *          - in: path
 *            name: id
 *            required: true
 *            description: Unique ID of the user to be deleted.
 *            schema:
 *                type: string
 *                example: 64b4cbe4d21e89001234abcd
 *      responses:
 *          200:
 *              description: User deleted successfully.
 *          404:
 *              description: User not found.
 *          500:
 *              description: Internal server error.
 */
app.delete('/delete-user/:id', (req, res) => {
  const { id } = req.params
  UsersData.findByIdAndDelete({ _id: id })
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

/**
 *  @swagger
 *  tags:
 *      - name: User
 *        description: Operations related to user management
 *
 * /usersses:
 *  get:
 *      tags:
 *          - User
 *      summary: User List
 *      description: Retrieves a list of all users
 *      responses:
 *          200:
 *              description: List fetched successfully
 *              content:
 *                  application/json:
 *                      schema:
 *                          type: array
 *                          items:
 *                              type: object
 */
app.get('/usersses', (req, res) => {
  Users.find()
    .then(result => res.json(result))
    .catch(err => res.json(err))
})

app.listen(3001, () => {
  console.log('Server is running on port 3001')
})
