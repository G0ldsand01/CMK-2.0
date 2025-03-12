export type Product = {
    id: number;
    name: string;
    price: number;
    image: ImageMetadata;
    description: string;
    rating: number;
    reviews: number;
};

import MouseImage from '../assets/mouse.webp';
import KeyboardImage from '../assets/keyboard.png';
import HeadsetImage from '../assets/headset.png';

export const products: Product[] = [
    {
        id : 1,
        name : "Mouse",
        price : 100,
        image : MouseImage,
        description: "A high-quality mouse",
        rating: 4.5,
        reviews: 150
    },
    {
        id : 2,
        name : "Keyboard",
        price : 50,
        image : KeyboardImage,
        description: "A high-quality keyboard",
        rating: 4.5,
        reviews: 150
    },
    {
        id : 3,
        name : "Headset",
        price : 300,
        image : HeadsetImage,
        description: "A high-quality headset",
        rating: 4.5,
        reviews: 150
    },
    {
        id : 4,
        name : "Mouse",
        price : 100,
        image : MouseImage,
        description: "A high-quality mouse",
        rating: 4.5,
        reviews: 150
    },
    {
        id : 5,
        name : "Keyboard",
        price : 50,
        image : KeyboardImage,
        description: "A high-quality keyboard",
        rating: 4.5,
        reviews: 150
    },
    {
        id : 6,
        name : "Headset",
        price : 300,
        image : HeadsetImage,
        description: "A high-quality headset",
        rating: 4.5,
        reviews: 150
    },
    {
        id : 7,
        name : "Mouse",
        price : 100,
        image : MouseImage,
        description: "A high-quality mouse",
        rating: 4.5,
        reviews: 150
    },
    {
        id : 8,
        name : "Keyboard",
        price : 50,
        image : KeyboardImage,
        description: "A high-quality keyboard",
        rating: 4.5,
        reviews: 150
    },
    {
        id : 9,
        name : "Headset",
        price : 300,
        image : HeadsetImage,
        description: "A high-quality headset",
        rating: 4.5,
        reviews: 150
    },
]