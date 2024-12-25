// ** Fake user data and data type

// ** Please remove below user data and data type in production and verify user with Real Database
export type UserTable = {
  _id: any
  name: string
  email: string
  image: string
  password: string
}

// =============== Fake Data ============================

export const users: UserTable[] = [
  {
    _id: 1,
    name: 'John Doe',
    password: 'admin',
    email: 'admin@vuexy.com',
    image: '/images/avatars/1.png'
  },
  {
    _id: 2,
    name: 'Vansh',
    password: 'admin',
    email: 'vansh@gmail.com',
    image: '/images/avatars/1.png'
  },
]
