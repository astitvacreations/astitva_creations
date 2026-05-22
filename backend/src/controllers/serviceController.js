import { Service } from '../models/Service.js';
import { cloudinary } from '../config/cloudinary.js';

export const getServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getServiceBySlug = async (req, res) => {
  try {
    const service = await Service.findOne({ slug: req.params.slug, isActive: true });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createService = async (req, res) => {
  try {
    const newService = new Service(req.body);
    const savedService = await newService.save();
    res.status(201).json(savedService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateService = async (req, res) => {
  try {
    const updatedService = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedService) return res.status(404).json({ message: 'Service not found' });
    res.status(200).json(updatedService);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteService = async (req, res) => {
  try {
    const deletedService = await Service.findByIdAndDelete(req.params.id);
    if (!deletedService) return res.status(404).json({ message: 'Service not found' });

    const urlsToDelete = [];
    if (deletedService.coverImage) urlsToDelete.push(deletedService.coverImage);
    if (deletedService.heroImage) urlsToDelete.push(deletedService.heroImage);
    if (deletedService.images?.length > 0) urlsToDelete.push(...deletedService.images);
    if (deletedService.heroImages?.length > 0) urlsToDelete.push(...deletedService.heroImages.map(hi => hi.url));

    const publicIds = urlsToDelete.map(url => {
      if (!url.includes('cloudinary')) return null;
      const parts = url.split('/');
      const filenameWithExt = parts.pop();
      const folderIndex = parts.indexOf('upload');
      const folderPath = folderIndex !== -1 ? parts.slice(folderIndex + 2).join('/') : '';
      const filename = filenameWithExt.split('.')[0];
      return folderPath ? `${folderPath}/${filename}` : filename;
    }).filter(id => id);

    if (publicIds.length > 0) {
      await Promise.all(publicIds.map(id => cloudinary.uploader.destroy(id).catch(err => console.error("Cloudinary delete err:", err))));
    }

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
