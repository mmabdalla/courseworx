import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { setDocumentDirection } from '../i18n';

const careerAccelerators = [
  {
    title: 'Full Stack Web Developer',
    img: '/images/courses/full-stack-web-developer/cover.jpg',
    rating: 4.7,
    ratingsCount: 876,
    totalHours: 120,
  },
  {
    title: 'Digital Marketer',
    img: '/images/courses/digital-marketer/cover.jpg',
    rating: 4.6,
    ratingsCount: 3500,
    totalHours: 284,
  },
  {
    title: 'Data Scientist',
    img: '/images/courses/data-scientist/cover.jpg',
    rating: 4.5,
    ratingsCount: 291,
    totalHours: 47,
  },
];

const skillsTabs = [
  'Data Science', 'IT Certifications', 'Leadership', 'Web Development', 'Communication', 'Business Analytics & Intelligence'
];

const skillCategories = [
  { name: 'ChatGPT', learners: '4M+', active: true },
  { name: 'Data Science', learners: '7M+' },
  { name: 'Python', learners: '4.8M+' },
  { name: 'Machine Learning', learners: '2M+' },
  { name: 'Deep Learning', learners: '2M+' },
  { name: 'Artificial Intelligence (AI)', learners: '4M+' },
  { name: 'Statistics', learners: '1M+' },
  { name: 'Natural Language Processing', learners: '854K+' },
];

const dataScienceCourses = [
  {
    title: 'The Complete AI Guide: Learn ChatGPT, Generative AI & More',
    author: 'Julian Melanson, Benza Maman, Leap...',
    rating: 4.7,
    ratingsCount: 3827,
    price: '£1,179.99',
    badge: 'Bestseller',
    img: 'https://randomuser.me/api/portraits/men/11.jpg',
    premium: false,
  },
  {
    title: 'The Complete AI-Powered Copywriting Course & ChatGPT...',
    author: 'Ing. Tomáš Morávek, Learn Digital...',
    rating: 4.4,
    ratingsCount: 1997,
    price: '£1,099.99',
    badge: 'Premium',
    img: 'https://randomuser.me/api/portraits/men/12.jpg',
    premium: true,
  },
  {
    title: 'ChatGPT, DeepSeek, Grok and 30+ More AI Marketing Assistants',
    author: 'Anton Voroniuk, Anton Voroniuk Support',
    rating: 4.6,
    ratingsCount: 7850,
    price: '£399.99',
    badge: 'Premium',
    img: 'https://randomuser.me/api/portraits/men/13.jpg',
    premium: true,
  },
  {
    title: 'Upgrade Your Social Media Presence with ChatGPT',
    author: 'Anton Voroniuk, Anton Voroniuk Support',
    rating: 4.2,
    ratingsCount: 833,
    price: '£399.99',
    badge: 'Premium',
    img: 'https://randomuser.me/api/portraits/men/14.jpg',
    premium: true,
  },
];

const trustedCompanies = [
  'vw', 'samsung', 'cisco', 'vimeo', 'pg', 'hp', 'citi', 'ericsson'
];

const learnersViewing = [
  {
    title: '100 Days of Code: The Complete Python Pro Bootcamp',
    author: 'Dr. Angela Yu',
    rating: 4.7,
    ratingsCount: 382772,
    price: '£2,749.99',
    badge: 'Bestseller',
    img: 'https://randomuser.me/api/portraits/women/21.jpg',
  },
  {
    title: 'The Complete Full-Stack Web Development Bootcamp',
    author: 'Dr. Angela Yu',
    rating: 4.7,
    ratingsCount: 1464390,
    price: '£1,769.99',
    badge: 'Bestseller',
    img: 'https://randomuser.me/api/portraits/women/22.jpg',
  },
  {
    title: '[NEW] Ultimate AWS Certified Cloud Practitioner CLF-C02...',
    author: 'Stephane Maarek',
    rating: 4.7,
    ratingsCount: 256000,
    price: '£1,679.99',
    badge: 'Bestseller',
    img: 'https://randomuser.me/api/portraits/men/23.jpg',
  },
  {
    title: 'Ultimate AWS Certified Solutions Architect Associate...',
    author: 'Stephane Maarek',
    rating: 4.7,
    ratingsCount: 264230,
    price: '£3,099.99',
    badge: 'Bestseller',
    img: 'https://randomuser.me/api/portraits/men/24.jpg',
  },
  {
    title: 'The Complete Python Bootcamp From Zero to Hero in Python',
    author: 'Jose Portilla',
    rating: 4.6,
    ratingsCount: 524520,
    price: '£2,149.99',
    badge: 'Bestseller',
    img: 'https://randomuser.me/api/portraits/men/25.jpg',
  },
];

function useSliderImages() {
  const [slides, setSlides] = useState([]);
  useEffect(() => {
    fetch('/uploads/slider/')
      .then(res => res.ok ? res.text() : Promise.reject('Failed to fetch slider images'))
      .then(html => {
        // Parse directory listing for images (works for default express static)
        const matches = Array.from(html.matchAll(/href="([^"]+\.(png|jpg|jpeg|gif|webp))"/gi));
        const images = matches.map(m => ({ img: '/uploads/slider/' + decodeURIComponent(m[1]), title: '', link: '' }));
        setSlides(images.length > 0 ? images : [{ img: '/images/cx-logo.png', title: 'Welcome to CourseWorx', link: '' }]);
      })
      .catch(() => setSlides([{ img: '/images/cx-logo.png', title: 'Welcome to CourseWorx', link: '' }]));
  }, []);
  return slides;
}

function HeroSlider() {
  const slides = useSliderImages();
  const [current, setCurrent] = useState(0);
  const next = () => setCurrent((c) => (c + 1) % slides.length);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);
  if (slides.length === 0) return null;
  return (
    <div className="relative bg-gray-200 rounded-xl h-64 flex items-center justify-center overflow-hidden">
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl cursor-pointer z-10">&#8592;</button>
      {slides[current].link && slides[current].link.trim() !== '' ? (
        <a href={slides[current].link} className="w-full h-full flex flex-col items-center justify-center">
          <img src={slides[current].img} alt={slides[current].title} className="h-48 object-contain mb-2" />
          <span className="text-gray-700 text-xl font-semibold bg-white bg-opacity-80 px-4 py-1 rounded-lg shadow">{slides[current].title}</span>
        </a>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <img src={slides[current].img} alt={slides[current].title} className="h-48 object-contain mb-2" />
          <span className="text-gray-700 text-xl font-semibold bg-white bg-opacity-80 px-4 py-1 rounded-lg shadow">{slides[current].title}</span>
        </div>
      )}
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl cursor-pointer z-10">&#8594;</button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <span key={i} className={`w-3 h-3 rounded-full ${i === current ? 'bg-primary-600' : 'bg-gray-400'} inline-block`}></span>
        ))}
      </div>
    </div>
  );
}

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' }
  ];

  const handleChange = (lang) => {
    i18n.changeLanguage(lang);
    setDocumentDirection(lang);
    setOpen(false);
  };

  return (
    <div className="relative ml-2">
      <button
        className="p-2 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-100"
        onClick={() => setOpen((o) => !o)}
        aria-label="Select language"
      >
        <GlobeAltIcon className="h-5 w-5 text-gray-500" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded shadow z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`block w-full text-left px-4 py-2 hover:bg-gray-100 ${i18n.language === lang.code ? 'font-bold text-primary-700' : ''}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Announcement Bar */}
      <div className="bg-primary-900 text-white text-center py-2 text-xl font-semibold tracking-wide">
        Announcements Space
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4">
          <div className="flex items-center space-x-4">
            <img src="/images/cx-logo.png" alt="CourseWorx Logo" className="h-8 w-auto mr-2" />
            <input
              type="text"
              placeholder="Search for anything"
              className="input-field w-96 ml-6"
            />
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-bold text-primary-700 uppercase tracking-wider">COURSEWORX Business</span>
            <a href="#" className="text-xs font-medium text-primary-700 hover:underline">Teach with us!</a>
            <Link to="/login" className="btn-secondary px-6 py-2">{t('login')}</Link>
            <Link to="/signup" className="btn-primary px-6 py-2">{t('signup')}</Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Hero Image Slider */}
      <div className="max-w-7xl mx-auto mt-6 mb-10 px-4">
        <HeroSlider />
      </div>

      {/* Career Accelerators */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('welcome')}</h2>
        <p className="text-gray-600 mb-6">Get the skills and real-world experience employers want with Career Accelerators.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {careerAccelerators.map((c, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-6 flex flex-col items-center">
              <img src={c.img} alt={c.title} className="w-28 h-28 rounded-full object-cover mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{c.title}</h3>
              <div className="flex items-center text-yellow-500 mb-1">
                <span className="mr-1">★</span>
                <span className="font-bold">{c.rating}</span>
                <span className="text-gray-500 ml-2">({c.ratingsCount} total)</span>
              </div>
              <span className="text-xs text-gray-500">{c.totalHours} total hours</span>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button className="btn-primary px-6 py-2">All Career Accelerators</button>
        </div>
      </section>

      {/* Skills Section */}
      <section className="bg-white py-10 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All the skills you need in one place</h2>
          <p className="text-gray-600 mb-6">From critical skills to technical topics, CourseWorx supports your professional development.</p>
          <div className="flex flex-wrap gap-4 mb-6">
            {skillsTabs.map((tab, i) => (
              <button key={i} className="px-4 py-2 rounded-full bg-gray-100 text-gray-700 font-medium hover:bg-primary-50 transition">{tab}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mb-8">
            {skillCategories.map((cat, i) => (
              <span key={i} className={`px-4 py-2 rounded-full border ${cat.active ? 'bg-primary-100 text-primary-700 border-primary-300 font-bold' : 'bg-gray-100 text-gray-700 border-gray-200'} text-sm`}>{cat.name} <span className="ml-1 text-xs text-gray-500">{cat.learners} learners</span></span>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {dataScienceCourses.map((course, i) => (
              <div key={i} className="bg-white rounded-xl shadow-md p-4 flex flex-col">
                <img src={course.img} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                <div className="text-xs text-gray-500 mb-1">{course.author}</div>
                <div className="flex items-center text-yellow-500 mb-1">
                  <span className="mr-1">★</span>
                  <span className="font-bold">{course.rating}</span>
                  <span className="text-gray-500 ml-2">({course.ratingsCount} ratings)</span>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-lg font-bold text-gray-900">{course.price}</span>
                  {course.badge && <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${course.badge === 'Bestseller' ? 'bg-yellow-100 text-yellow-800' : 'bg-purple-100 text-purple-800'}`}>{course.badge}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <button className="btn-secondary px-6 py-2">Show all Data Science courses</button>
          </div>
        </div>
      </section>

      {/* Trusted Companies */}
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-center gap-8">
          <span className="text-gray-500 text-sm mr-4">Trusted by over 16,000 companies and millions of learners around the world</span>
          {trustedCompanies.map((c, i) => (
            <span key={i} className="inline-block w-20 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-400 font-bold uppercase text-lg">{c}</span>
          ))}
        </div>
      </section>

      {/* Learners are viewing */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Learners are viewing</h2>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {learnersViewing.map((course, i) => (
            <div key={i} className="bg-white rounded-xl shadow-md p-4 min-w-[260px] flex flex-col">
              <img src={course.img} alt={course.title} className="w-full h-32 object-cover rounded-lg mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
              <div className="text-xs text-gray-500 mb-1">{course.author}</div>
              <div className="flex items-center text-yellow-500 mb-1">
                <span className="mr-1">★</span>
                <span className="font-bold">{course.rating}</span>
                <span className="text-gray-500 ml-2">({course.ratingsCount} ratings)</span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <span className="text-lg font-bold text-gray-900">{course.price}</span>
                {course.badge && <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">{course.badge}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
} 