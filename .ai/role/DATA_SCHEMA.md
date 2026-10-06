\-- Kích hoạt extension UUID cho Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";



\-- 1. Bảng merchants

CREATE TABLE merchants (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   name VARCHAR NOT NULL,

&#x20;   logo TEXT,

&#x20;   description TEXT,

&#x20;   phone VARCHAR,

&#x20;   website TEXT,

&#x20;   address TEXT,

&#x20;   status VARCHAR,

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- 2. Bảng products

CREATE TABLE products (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   merchant\_id UUID REFERENCES merchants(id) ON DELETE CASCADE,

&#x20;   name VARCHAR NOT NULL,

&#x20;   description TEXT,

&#x20;   category VARCHAR,

&#x20;   original\_price NUMERIC,

&#x20;   sale\_price NUMERIC,

&#x20;   commission\_rate NUMERIC,

&#x20;   valid\_from TIMESTAMP,

&#x20;   valid\_to TIMESTAMP,

&#x20;   booking\_url TEXT,

&#x20;   payment\_url TEXT,

&#x20;   status VARCHAR,

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- 3. Bảng resellers

CREATE TABLE resellers (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   name VARCHAR NOT NULL,

&#x20;   email VARCHAR UNIQUE,

&#x20;   phone VARCHAR,

&#x20;   status VARCHAR,

&#x20;   commission\_rate NUMERIC,

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- 4. Bảng social\_accounts

CREATE TABLE social\_accounts (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   reseller\_id UUID REFERENCES resellers(id) ON DELETE CASCADE,

&#x20;   platform VARCHAR,

&#x20;   username VARCHAR,

&#x20;   url TEXT,

&#x20;   followers INTEGER,

&#x20;   average\_views INTEGER,

&#x20;   status VARCHAR,

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- 5. Bảng campaigns

CREATE TABLE campaigns (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   merchant\_id UUID REFERENCES merchants(id) ON DELETE CASCADE,

&#x20;   product\_id UUID REFERENCES products(id) ON DELETE CASCADE,

&#x20;   name VARCHAR NOT NULL,

&#x20;   start\_date TIMESTAMP,

&#x20;   end\_date TIMESTAMP,

&#x20;   target\_audience VARCHAR,

&#x20;   target\_location VARCHAR,

&#x20;   commission\_rate NUMERIC,

&#x20;   status VARCHAR

);



\-- 6. Bảng contents

CREATE TABLE contents (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   campaign\_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,

&#x20;   reseller\_id UUID REFERENCES resellers(id) ON DELETE CASCADE,

&#x20;   persona VARCHAR,

&#x20;   hook TEXT,

&#x20;   script TEXT,

&#x20;   caption TEXT,

&#x20;   video\_url TEXT,

&#x20;   tracking\_url TEXT,

&#x20;   status VARCHAR,

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);



\-- 7. Bảng tracking\_events

CREATE TABLE tracking\_events (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   reseller\_id UUID REFERENCES resellers(id) ON DELETE CASCADE,

&#x20;   campaign\_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,

&#x20;   product\_id UUID REFERENCES products(id) ON DELETE CASCADE,

&#x20;   event\_type VARCHAR,

&#x20;   timestamp TIMESTAMP DEFAULT NOW(),

&#x20;   metadata JSONB

);



\-- 8. Bảng orders

CREATE TABLE orders (

&#x20;   id UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   merchant\_id UUID REFERENCES merchants(id) ON DELETE CASCADE,

&#x20;   reseller\_id UUID REFERENCES resellers(id) ON DELETE CASCADE,

&#x20;   product\_id UUID REFERENCES products(id) ON DELETE CASCADE,

&#x20;   amount NUMERIC,

&#x20;   commission\_amount NUMERIC,

&#x20;   status VARCHAR,

&#x20;   booking\_reference VARCHAR,

&#x20;   created\_at TIMESTAMP DEFAULT NOW()

);

