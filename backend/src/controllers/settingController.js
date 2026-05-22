import { Setting } from '../models/Setting.js';

// @desc    Get all settings
// @route   GET /api/settings
// @access  Public
export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({
        heroSlides: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
            caption: 'Capturing Timeless Elegance',
            description: 'Your Story, Told Cinematically.',
            position: '50% 50%'
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80',
            caption: '',
            description: 'Every moment, beautifully preserved',
            position: '50% 50%'
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80',
            caption: '',
            description: 'Cinematic stories for the ages',
            position: '50% 50%'
          }
        ]
      });
    } else {
      let needsSave = false;
      if (!settings.heroSlides || settings.heroSlides.length === 0) {
        settings.heroSlides = [
          {
            imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80',
            caption: 'Capturing Timeless Elegance',
            description: 'Your Story, Told Cinematically.',
            position: '50% 50%'
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&q=80',
            caption: '',
            description: 'Every moment, beautifully preserved',
            position: '50% 50%'
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80',
            caption: '',
            description: 'Cinematic stories for the ages',
            position: '50% 50%'
          }
        ];
        needsSave = true;
      }
      if (!settings.serviceCategories) {
        settings.serviceCategories = {
          'WEDDING': [
            'WEDDING', 'ENGAGEMENT', 'HALDI', 'MEHENDI', 'SANGEET', 
            'PELLIKODUKU', 'PELLIKUTURU', 'GODUMRAI', 'RECEPTION', 
            'VRATHAM', 'COCKTAIL PARTY'
          ],
          'HALF SAREE': [
            'HALF SAREE CEREMONY', 'HALDI', 'MEHENDI', 'RECEPTION'
          ],
          'BABY SHOOT': [
            'PRE BABY SHOOT', 'POST BABY SHOOT', 'BABY SHOWER', 'FIRST BIRTHDAY'
          ]
        };
        settings.markModified('serviceCategories');
        needsSave = true;
      }
      if (!settings.standardServices || settings.standardServices.length === 0) {
        settings.standardServices = [
          'Traditional Photography',
          'Candid Photography',
          'Traditional Videography',
          'Cinematic Video',
          'Drone',
          'FPV Drone',
          '360° VR Coverage'
        ];
        needsSave = true;
      }
      if (!settings.whatsappNumber || settings.whatsappNumber === '+919876543210' || settings.whatsappNumber === '+91987654333' || settings.whatsappNumber === '919876543210') {
        settings.whatsappNumber = '+919505878486';
        needsSave = true;
      }
      if (!settings.heroMainCaption) {
        settings.heroMainCaption = 'Capturing Timeless Elegance';
        needsSave = true;
      }
      if (!settings.heroMainDescription) {
        settings.heroMainDescription = 'Your Story,\nTold Cinematically.';
        needsSave = true;
      }
      if (needsSave) {
        await settings.save();
      }
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update settings
// @route   PATCH /api/settings
// @access  Admin
export const updateSettings = async (req, res) => {
  try {
    console.log('Update Settings Request Body:', req.body);
    const settings = await Setting.findOneAndUpdate(
      {}, 
      req.body, 
      { returnDocument: 'after', upsert: true, runValidators: true }
    );
    res.status(200).json(settings);
  } catch (error) {
    console.error('Update Settings Error:', error);
    res.status(400).json({ message: error.message });
  }
};
