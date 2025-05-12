import bcrypt from 'bcryptjs';
import postgres from 'postgres';
import { invoices, customers, revenue, users } from '../../lib/placeholder-data';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });
async function testSqlConnection(sql: postgres.Sql) {
    try {
        await sql`SELECT 1 AS test`;
        return {
            valid: true,
            message: '数据库连接有效',
        };
    } catch (error: any) {
        console.log('simpleSelect sql success');
        return {
            valid: false,
            message: '数据库连接无效',
            error: {
                message: error.message,
                code: error.code || 'UNKNOWN',
            },
        };
    }
}

async function simpleSelect() {
    try {
        await sql`SELECT 1 AS test`;
        console.log('simpleSelect sql success');
    } catch (error) {
        console.log('simpleSelect sql fail');
    }
}
async function seedUsers() {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );
  `;

    const insertedUsers = await Promise.all(
        users.map(async (user) => {
            const hashedPassword = await bcrypt.hash(user.password, 10);
            return sql`
        INSERT INTO users (id, name, email, password)
        VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
        ON CONFLICT (id) DO NOTHING;
      `;
        }),
    );

    return insertedUsers;
}


async function seedInvoices() {
    console.log('into seedInvoices')
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    );
  `;

    // console.log('Invoices array:', invoices);
    // if (!invoices || !Array.isArray(invoices)) {
    //     console.error('Invalid invoices array');
    //     return [];
    // }
    // invoices.forEach((inv, idx) => {
    //     console.log(`Invoice ${idx}:`, inv);
    //     if (!inv.customer_id || !inv.amount || !inv.status || !inv.date) {
    //         console.error(`Invalid invoice at index ${idx}`);
    //     }
    // });

    const insertedInvoices = await Promise.all(
        invoices.map(
            (invoice) => sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
        ON CONFLICT (id) DO NOTHING;
      `,
        ),
    );

    // const insertedInvoices = await Promise.all(
    //     invoices.map(async (invoice) => {
    //         try {
    //             console.log(`${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date}`);
    //             return await sql`
    //     INSERT INTO invoices (customer_id, amount, status, date)
    //     VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
    //     ON CONFLICT (id) DO NOTHING; `;
    //         } catch (error) {
    //             console.error(`Failed to insert invoice for customer ${invoice.customer_id}:`, error);
    //             return null; // 或者你可以选择返回一个特定对象来标记失败
    //         }
    //     })
    // );

    console.log('out seedInvoices')
    return insertedInvoices;
}

async function seedCustomers() {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    );
  `;

    const insertedCustomers = await Promise.all(
        customers.map(
            (customer) => sql`
        INSERT INTO customers (id, name, email, image_url)
        VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
        ON CONFLICT (id) DO NOTHING;
      `,
        ),
    );

    return insertedCustomers;
}

async function seedRevenue() {
    await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    );
  `;

    const insertedRevenue = await Promise.all(
        revenue.map(
            (rev) => sql`
        INSERT INTO revenue (month, revenue)
        VALUES (${rev.month}, ${rev.revenue})
        ON CONFLICT (month) DO NOTHING;
      `,
        ),
    );

    return insertedRevenue;
}

export async function GET() {
    const result = await testSqlConnection(sql);
    if (result.valid) {
        console.log('数据库连接有效');
        try {
            console.log('sql begining');
            const result = await sql.begin((sql) => [
                // simpleSelect(),
                // seedUsers(),
                // seedCustomers(),
                // seedInvoices(),
                seedRevenue(),
            ]);
            console.log('sql ending');
            return Response.json({ message: 'Database seeded successfully' });
        } catch (error) {
            return Response.json({ error }, { status: 500 });
        }
    } else {
        return Response.json(
            {
                status: 'error',
                message: result.message,
                error: result.error,
            },
            { status: 500 }
        );
    }
}