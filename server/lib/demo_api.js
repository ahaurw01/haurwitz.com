var _ = require('lodash');

var customers = [
      {
        id: 1,
        handle: 'bigapple',
        firstName: 'Bob',
        lastName: 'Apple',
        wishlistId: 10
      },
      {
        id: 2,
        handle: 'heygurl',
        firstName: 'Susan',
        lastName: 'Lazy',
        wishlistId: 11
      }
    ],
    wishlists = [
      {
        id: 10,
        productIds: []
      },
      {
        id: 11,
        productIds: []
      }
    ],
    products = [ // categories: toys, electronics, books, apparel, beer
      {
        id: 1001,
        name: 'Yo-yo',
        price: 3.99,
        description: 'Invented before Christ and totally making a comeback. Get your sleeper on, walk the dog, and cradle that cat. You are never too old to look like a child.',
        rating: 4,
        imageUrl: '',
        inStock: true,
        category: 'toys',
        isFeatured: true
      },
      {
        id: 1002,
        name: 'Stuffed bear',
        price: 8.69,
        description: 'It is just like the real thing, except miniturized, has stuffing instead of real bear parts, and does not kill men!',
        rating: 3,
        imageUrl: '',
        inStock: true,
        category: 'toys',
        isFeatured: false
      },
      {
        id: 1003,
        name: 'Doll',
        price: 15.95,
        description: 'For kids of all ages and genders who want to look like a litte girl.',
        rating: 5,
        imageUrl: '',
        inStock: false,
        category: 'toys',
        isFeatured: false
      },
      {
        id: 1011,
        name: 'Laptop',
        price: 899.98,
        description: 'Fits in your lap and spins like a top! Wait...',
        rating: 2,
        imageUrl: '',
        inStock: true,
        category: 'electronics',
        isFeatured: true
      },
      {
        id: 1012,
        name: 'Massager',
        price: 18.99,
        description: 'It\'s for when you have a sore back and stuff. Yeah, that\'s like totally what it\'s for.',
        rating: 5,
        imageUrl: '',
        inStock: true,
        category: 'electronics',
        isFeatured: false
      },
      {
        id: 1013,
        name: 'Cell phone',
        price: 199.99,
        description: 'Set yourself up with our 15-year plan and get a great price on this phone you\'ll hate in three days!',
        rating: 1,
        imageUrl: '',
        inStock: true,
        category: 'electronics',
        isFeatured: false
      },
      {
        id: 1021,
        name: 'The Bible',
        price: 10.99,
        description: 'Written like a long time ago before magical realism was hip. Don\'t miss the parts about the talking plantlife and totally epic flood.',
        rating: 3,
        imageUrl: '',
        inStock: true,
        category: 'books',
        isFeatured: false
      },
      {
        id: 1022,
        name: 'How to Toast Bread',
        price: 9.99,
        description: 'A self-help classic. Who does\'t have trouble making proper toast from time to time? Learn the techniques, master the art.',
        rating: 5,
        imageUrl: '',
        inStock: true,
        category: 'books',
        isFeatured: true
      },
      {
        id: 1023,
        name: 'The Phonebook',
        price: 0.99,
        description: 'We got like a million of these dropped off at our doorstep and don\'t have that many people to call.',
        rating: 2,
        imageUrl: '',
        inStock: true,
        category: 'books',
        isFeatured: false
      },
      {
        id: 1031,
        name: 'Shirt',
        price: 13.50,
        description: 'You wear it on the top of your body. How do you not know what a shirt is?',
        rating: 3,
        imageUrl: '',
        inStock: false,
        category: 'apparel',
        isFeatured: true
      },
      {
        id: 1032,
        name: 'Pastel shorts',
        price: 69.95,
        description: 'These go really well with your popped collar and boat shoes, brah. It\'s expensive, but you want to fit in, right?',
        rating: 5,
        imageUrl: '',
        inStock: true,
        category: 'apparel',
        isFeatured: false
      },
      {
        id: 1033,
        name: 'Frilly turtleneck',
        price: 11.75,
        description: 'For all those times your mom wants you to be warm and look totally uncool at the same time.',
        rating: 2,
        imageUrl: '',
        inStock: true,
        category: 'apparel',
        isFeatured: false
      },
      {
        id: 1041,
        name: 'Lite Lager',
        price: 3.99,
        description: 'What time is it? Cheap-beer-and-gettin-crunk-o\'clock, my man. Party like you mean it.',
        rating: 2,
        imageUrl: '',
        inStock: true,
        category: 'beer',
        isFeatured: false
      },
      {
        id: 1042,
        name: 'Import Lager',
        price: 7.99,
        description: 'You don\'t really know why you drink it, but that guy at the club with the shirt that has three collars looks really cool with one of these in his hands, so okay.',
        rating: 3,
        imageUrl: '',
        inStock: false,
        category: 'beer',
        isFeatured: false
      },
      {
        id: 1043,
        name: 'Craft IPA',
        price: 13.99,
        description: 'Holy crap that\'s strong. And my beer snob cred is intact.',
        rating: 5,
        imageUrl: '',
        inStock: true,
        category: 'beer',
        isFeatured: false
      },
    ];
    

module.exports.getCustomer = function (req, res) {
  res.send({customer: _.find(customers, {handle: req.params.handle})});
};

module.exports.getProducts = function (req, res) {
  res.send({products: products});
};

module.exports.getProduct = function (req, res) {
  res.send({product: _.find(products, {id: +req.params.productId})});
};

module.exports.getWishlist = function (req, res) {
  res.send({wishlist: _.find(wishlists, {id: +req.params.wishlistId})});
};

module.exports.putWishlist = function (req, res) {
  var wishlist = _.find(wishlists, {id: +req.params.wishlistId});
  console.log(Object.keys(req.body));
  wishlist.productIds = req.body.productIds;
  res.send({wishlist: wishlist});
};