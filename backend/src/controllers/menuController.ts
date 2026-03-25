import { Request, Response } from 'express';

// Mock data - Replace with real data later
const menuItems = [
    { id: 1, name: 'Pizza', category: 'Main Course', description: 'Delicious cheese pizza' },
    { id: 2, name: 'Salad', category: 'Appetizer', description: 'Fresh garden salad' },
    // More items...
];

const categories = ['Main Course', 'Appetizer', 'Dessert', 'Beverage'];

// Get all menu items
export const getMenuItems = (req: Request, res: Response) => {
    res.json(menuItems);
};

// Get all categories
export const getCategories = (req: Request, res: Response) => {
    res.json(categories);
};

// Search menu items
export const searchMenuItems = (req: Request, res: Response) => {
    const { query } = req.query;
    const filteredItems = menuItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
    res.json(filteredItems);
};

// Get item details
export const getItemDetails = (req: Request, res: Response) => {
    const { id } = req.params;
    const item = menuItems.find(item => item.id === parseInt(id));
    if (item) {
        res.json(item);
    } else {
        res.status(404).send('Item not found');
    }
};

// Add the routes to your express app
// Example:
// import express from 'express';
// const app = express();
// app.get('/api/menu/items', getMenuItems);
// app.get('/api/menu/categories', getCategories);
// app.get('/api/menu/search', searchMenuItems);
// app.get('/api/menu/items/:id', getItemDetails);