import { useState } from 'react';
import { Plus, Edit2, Trash2, X, Check, Quote, Link as LinkIcon } from 'lucide-react';
import { useTestimonialStore } from '../../store/testimonialStore';

export default function TestimonialsManager() {
  const { testimonials, addTestimonial, updateTestimonial, deleteTestimonial } = useTestimonialStore();
  const [isEditing, setIsEditing] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(null);

  const [formData, setFormData] = useState({
    text: '',
    author: '',
    googleReviewUrl: '',
    rating: 5
  });

  const handleEdit = (testimonial) => {
    setCurrentTestimonial(testimonial);
    setFormData({
      text: testimonial.text,
      author: testimonial.author,
      googleReviewUrl: testimonial.googleReviewUrl || '',
      rating: testimonial.rating || 5
    });
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      deleteTestimonial(id);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentTestimonial) {
        await updateTestimonial(currentTestimonial._id, formData);
      } else {
        await addTestimonial(formData);
      }
      setIsEditing(false);
      setCurrentTestimonial(null);
      setFormData({ text: '', author: '', googleReviewUrl: '', rating: 5 });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentTestimonial(null);
    setFormData({ text: '', author: '', googleReviewUrl: '', rating: 5 });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading text-[var(--color-gold)] mb-2">Testimonials Manager</h1>
          <p className="text-[#A1A1A1]">Manage client reviews shown on the Home Page.</p>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Testimonial
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="bg-[#111] border border-[#222] p-8 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-heading text-[var(--color-gold)]">
              {currentTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h2>
            <button onClick={handleCancel} className="text-[#A1A1A1] hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Client Name(s)</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full bg-black border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                placeholder="e.g. Arjun & Niharika"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Review Text</label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full bg-black border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors h-32"
                placeholder="Enter client quote..."
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Google Review URL (Optional)</label>
              <input
                type="url"
                value={formData.googleReviewUrl}
                onChange={(e) => setFormData({ ...formData, googleReviewUrl: e.target.value })}
                className="w-full bg-black border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                placeholder="e.g. https://g.co/kgs/..."
              />
              <p className="text-[10px] text-[#666] uppercase mt-1 tracking-wider">Paste the specific Google Review link to show a verified review link badge on the public testimonials page.</p>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[#A1A1A1] mb-2">Rating (1 to 5 Stars)</label>
              <select
                value={formData.rating}
                onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                className="w-full bg-black border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                required
              >
                <option value={5}>5 Stars</option>
                <option value={4}>4 Stars</option>
                <option value={3}>3 Stars</option>
                <option value={2}>2 Stars</option>
                <option value={1}>1 Star</option>
              </select>
            </div>
            
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs hover:bg-white transition-colors"
              >
                <Check className="w-4 h-4" /> Save Testimonial
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 border border-[#333] text-white font-bold uppercase tracking-widest text-xs hover:bg-[#222] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testimonials.map((testimonial) => (
          <div key={testimonial._id} className="bg-[#111] border border-[#222] p-6 flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <Quote className="w-8 h-8 text-[var(--color-gold)] opacity-50" />
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(testimonial)}
                  className="p-2 text-[#A1A1A1] hover:text-[var(--color-gold)] transition-colors bg-black"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(testimonial._id)}
                  className="p-2 text-[#A1A1A1] hover:text-red-500 transition-colors bg-black"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {testimonial.googleReviewUrl && (
              <a
                href={testimonial.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 flex items-center gap-1.5 text-[10px] text-[var(--color-gold)] uppercase tracking-widest border border-[var(--color-gold)]/20 px-2.5 py-1.5 self-start bg-black/40 hover:bg-[var(--color-gold)]/10 hover:border-[var(--color-gold)]/40 transition-all duration-300"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.78 0 3.42.67 4.67 1.865l2.405-2.405C17.585 1.83 15.08 1 12.24 1c-5.52 0-10 4.48-10 10s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.66-.06-1.3-.17-1.945H12.24z"/>
                </svg>
                Google Review ↗
              </a>
            )}

            <div className="flex gap-1 text-[var(--color-gold)] text-lg mb-4">
              {[...Array(testimonial.rating || 5)].map((_, idx) => (
                <span key={idx}>★</span>
              ))}
            </div>
            <p className="text-[#E0E0E0] text-sm leading-relaxed mb-6 italic flex-grow">
              "{testimonial.text}"
            </p>
            <div className="text-[var(--color-gold)] text-xs font-bold uppercase tracking-widest">
              {testimonial.author}
            </div>
          </div>
        ))}
        {testimonials.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#A1A1A1]">
            No testimonials found. Add some to display on the home page.
          </div>
        )}
      </div>
    </div>
  );
}
