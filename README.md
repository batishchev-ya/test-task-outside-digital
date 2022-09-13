# Test Task for Digital Outside

This is test project implemeting basic CRUD operations for three tables: Users, Tags, Usertags using Node.js and PostgreSQL with authentication and authorization.

## Getting start

### Instalation

1.  Install [Node.js](https://nodejs.org/en/)
2.  Create remote DataBase using [ElephantSQL](https://www.elephantsql.com/)
3.  Create new directory
4.  Clone this Git Repository to your directory

```sh
git clone https://github.com/batishchev-ya/test-task-outside-digital
```

5. Install dependencies

```sh
npm install
```

6. Configure environment variables in a new .env file (you have example of config.env file in env.sample)

7. To create tables in new database, type

```sh
npm run init_db
```

### Running

```sh
npm run
```

### API endpoints

- POST /signin

```json
{
  "email": "example@exe.com",
  "password": "example",
  "nickname": "nickname"
}
```

RETURN:

```json
{
  "token": "token",
  "expire": "1800"
}
```

---

- POST /login

```json
{
  "email": "example@exe.com",
  "password": "example"
}
```

RETURN:

```json
{
  "token": "token",
  "expire": "1800"
}
```

---

- POST /logout

  HEADER: `Authorization: Bearer {token}`

**Below are APIs with authorization**

---

- GET /user

  HEADER: `Authorization: Bearer {token}`

RETURN:

```json
{
  "email": "example@exe.com",
  "nickname": "example",
  "tags": [
    {
      "id": "id",
      "name": "example",
      "sortOrder": "0"
    }
  ]
}
```

---

- PUT /user

  HEADER: `Authorization: Bearer {token}`

```json
{
  "email": "example@exe.com",
  "password": "example",
  "nickname": "example"
}
```

All fields are optional

RETURN :

```json
{
  "email": "example@exe.com",
  "nickname": "example"
}
```

---

- DELETE /user

  HEADER: `Authorization: Bearer {token}`

Log out and delete user

---

- POST /tag

  HEADER: `Authorization: Bearer {token}`

```json
{
  "name": "example",
  "sortOrder": "0"
}
```

**sortOrder** is optional, default is 0

RETURN :

```json
{
  "id": "id",
  "name": "example",
  "sortOrder": "0"
}
```

---

- GET /tag/{id}

  HEADER: `Authorization: Bearer {token}`

RETURN :

```json
{
  "creator": {
    "nickname": "example",
    "uid": "exam-pl-eUID"
  },
  "name": "example",
  "sortOrder": "0"
}
```

---

- GET /tag?sortByOrder&sortByName&offset=10&length=10

  HEADER: `Authorization: Bearer {token}`

**sortByOrder**, **offset** **SortByName**, **length** are optional

**length** is element quantity in selection

RETURN :

```json
{
  "data": [
    {
      "creator": {
        "nickname": "example",
        "uid": "exam-pl-eUID"
      },
      "name": "example",
      "sortOrder": "0"
    },
    {
      "creator": {
        "nickname": "example",
        "uid": "exam-pl-eUID"
      },
      "name": "example",
      "sortOrder": "0"
    }
  ],
  "meta": {
    "offset": 10,
    "length": 10,
    "quantity": 100
  }
}
```

**quantity** is overall elements quantity

---

- PUT /tag/{id}

  HEADER: `Authorization: Bearer {token}`

Only owner can change tag

```json
{
  "name": "example",
  "sortOrder": "0"
}
```

**name** and **sortOrder** are optional

RETURN :

```json
{
  "creator": {
    "nickname": "example",
    "uid": "exam-pl-eUID"
  },
  "name": "example",
  "sortOrder": "0"
}
```

---

- DELETE /tag/{id}

HEADER: `Authorization: Bearer {token}`

Only owner can delete tags

---

- POST /user/tag

  HEADER: `Authorization: Bearer {token}`

```json
{
  "tags": [1, 2]
}
```

if one of the tags is missing, none of them will be added to user

RETURN :

```json
{
  "tags": [
    {
      "id": 1,
      "name": "example",
      "sortOrder": "0"
    },
    {
      "id": 2,
      "name": "example",
      "sortOrder": "0"
    },
    {
      "id": 3,
      "name": "example",
      "sortOrder": "0"
    }
  ]
}
```

---

- DELETE /user/tag/{id}

  HEADER: `Authorization: Bearer {token}`

RETURN :

```json
{
  "tags": [
    {
      "id": 1,
      "name": "example",
      "sortOrder": "0"
    },
    {
      "id": 2,
      "name": "example",
      "sortOrder": "0"
    },
    {
      "id": 3,
      "name": "example",
      "sortOrder": "0"
    }
  ]
}
```

---

- GET /user/tag/my

  HEADER: `Authorization: Bearer {token}`

List of tags where the user is the creator

RETURN :

```json
{
  "tags": [
    {
      "id": 1,
      "name": "example",
      "sortOrder": "0"
    },
    {
      "id": 2,
      "name": "example",
      "sortOrder": "0"
    },
    {
      "id": 3,
      "name": "example",
      "sortOrder": "0"
    }
  ]
}
```
