import { PrismaClient } from '@prisma/client';
import { existsSync, mkdirSync, copyFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// Real, already-uploaded images reused for seed data (never fetched from the internet).
const UPLOADS_ROOT = join(process.cwd(), 'uploads-public');
const SEED_AVATAR_SOURCE = join(UPLOADS_ROOT, 'avatars', 'Mh7Cw6O6qphRrbc3vBVO6KPgzyG2.jpg');
const SEED_COVER_SOURCE = join(
  UPLOADS_ROOT,
  'covers',
  'courses',
  'cPPTkq4I7GgBzRCwfXsWYQede473',
  '1787157137153-Black_and_White_Minimalist_Monogram_Real_Estate_Logo.png',
);

/** Idempotently copies a real seed source image to a destination inside uploads-public, returning the storage-relative path. */
function copySeedImage(source: string, destRelPath: string): string {
  const destAbsPath = join(UPLOADS_ROOT, destRelPath);
  mkdirSync(join(destAbsPath, '..'), { recursive: true });
  if (!existsSync(destAbsPath)) {
    copyFileSync(source, destAbsPath);
  }
  return destRelPath;
}

const categories = [
  {
    slug: 'marketing',
    name: 'Marketing',
    description: 'Positioning, campaigns, and channel strategy.',
  },
  {
    slug: 'seo',
    name: 'SEO',
    description: 'Organic search, content strategy, technical SEO.',
  },
  {
    slug: 'analytics',
    name: 'Analytics',
    description: 'Measurement, dashboards, and data-driven decisions.',
  },
  {
    slug: 'growth',
    name: 'Growth',
    description: 'Acquisition, retention, and experimentation.',
  },
  {
    slug: 'automation',
    name: 'Automation',
    description: 'Workflows, CRM, and AI-assisted marketing ops.',
  },
  {
    slug: 'web-development',
    name: 'Web Development',
    description: 'Landing pages, sites, and no-code/low-code builds.',
  },
  {
    slug: 'design',
    name: 'Design',
    description: 'Brand, UI, and creative for marketing teams.',
  },
  {
    slug: 'ai-ml',
    name: 'AI & Machine Learning',
    description: 'Applied AI for marketing and product teams.',
  },
];

type DemoTeacher = {
  uid: string;
  name: string;
  email: string;
  expertise: string;
  experience: string;
  bio: string;
  profileTemplate: 'classic' | 'editorial' | 'minimal';
  coverFrom: string;
  coverTo: string;
  course: {
    slug: string;
    title: string;
    summary: string;
    description: string;
    categorySlug: string;
    level: string;
    price: number;
    discountPercent: number;
  };
  ebook?: {
    slug: string;
    title: string;
    description: string;
    pages: number;
    price: number;
  };
  bootcamp?: {
    slug: string;
    title: string;
    tagline: string;
    description: string;
    durationWeeks: number;
    cohortSize: number;
    price: number;
    nextCohortDate: string;
    applicationDeadline: string;
  };
};

const demoTeachers: DemoTeacher[] = [
  {
    uid: 'seed-teacher-priya-sharma',
    name: 'Priya Sharma',
    email: 'priya.sharma@example.com',
    expertise: 'SEO Consultant',
    experience: '5–10 years',
    bio: 'Former in-house SEO lead at two Series B startups, now teaching technical SEO and content strategy to marketing teams who want to stop guessing and start ranking.',
    profileTemplate: 'editorial',
    coverFrom: '#7c3aed',
    coverTo: '#4c1d95',
    course: {
      slug: 'technical-seo-for-marketers',
      title: 'Technical SEO for Marketers',
      summary: 'Crawlability, site speed, and structured data — without needing to file an engineering ticket.',
      description:
        'A practical technical SEO course for marketers: audit a site, prioritize fixes that actually move rankings, and speak the same language as your engineering team.',
      categorySlug: 'seo',
      level: 'Intermediate',
      price: 79,
      discountPercent: 15,
    },
    ebook: {
      slug: 'the-content-audit-playbook',
      title: 'The Content Audit Playbook',
      description: 'A step-by-step framework for auditing, consolidating, and re-optimizing an existing content library.',
      pages: 48,
      price: 15,
    },
  },
  {
    uid: 'seed-teacher-marcus-webb',
    name: 'Marcus Webb',
    email: 'marcus.webb@example.com',
    expertise: 'Web & Landing Page Developer',
    experience: '3–5 years',
    bio: 'Builds high-converting landing pages for marketing teams without waiting on engineering. Teaches practical, no-fluff web development for non-developers.',
    profileTemplate: 'minimal',
    coverFrom: '#059669',
    coverTo: '#064e3b',
    course: {
      slug: 'landing-pages-that-convert',
      title: 'Landing Pages That Convert',
      summary: 'Build and ship a fast, high-converting landing page yourself — no engineering backlog required.',
      description:
        'Learn to build launch-ready landing pages using modern no-code and lightweight code tools, with a focus on speed, conversion, and analytics tracking.',
      categorySlug: 'web-development',
      level: 'Beginner',
      price: 59,
      discountPercent: 0,
    },
  },
  {
    uid: 'seed-teacher-sofia-chen',
    name: 'Sofia Chen',
    email: 'sofia.chen@example.com',
    expertise: 'Marketing Data Analyst',
    experience: '5–10 years',
    bio: 'Spent six years building marketing dashboards and attribution models before going independent. Teaches analytics the way marketers actually need it — practical, not academic.',
    profileTemplate: 'classic',
    coverFrom: '#d97706',
    coverTo: '#92400e',
    course: {
      slug: 'marketing-analytics-with-sql',
      title: 'Marketing Analytics with SQL',
      summary: 'Query your own marketing data instead of waiting on a data team.',
      description:
        'A hands-on SQL course built specifically for marketers: campaign performance, cohort retention, and attribution, all queried from scratch.',
      categorySlug: 'analytics',
      level: 'Intermediate',
      price: 89,
      discountPercent: 10,
    },
    bootcamp: {
      slug: 'analytics-attribution-bootcamp',
      title: 'Analytics & Attribution Bootcamp',
      tagline: 'Five weeks to a marketing dashboard and attribution model you actually trust.',
      description:
        'A live cohort-based bootcamp building a complete marketing analytics stack — tracking, dashboards, and attribution — from scratch.',
      durationWeeks: 5,
      cohortSize: 18,
      price: 749,
      nextCohortDate: '2026-11-02T00:00:00.000Z',
      applicationDeadline: '2026-10-22T00:00:00.000Z',
    },
  },
  {
    uid: 'seed-teacher-james-okafor',
    name: 'James Okafor',
    email: 'james.okafor@example.com',
    expertise: 'AI & Marketing Automation Specialist',
    experience: '3–5 years',
    bio: 'Helps marketing teams automate the busywork with AI — from content pipelines to lead scoring — without needing a data science degree.',
    profileTemplate: 'editorial',
    coverFrom: '#0891b2',
    coverTo: '#164e63',
    course: {
      slug: 'ai-powered-marketing-automation',
      title: 'AI-Powered Marketing Automation',
      summary: 'Automate lead scoring, content drafts, and campaign QA with AI — practically, not theoretically.',
      description:
        'Build real AI-assisted workflows into your marketing stack: automated lead scoring, first-draft content generation, and campaign QA, all with tools you already have.',
      categorySlug: 'ai-ml',
      level: 'Intermediate',
      price: 99,
      discountPercent: 0,
    },
    ebook: {
      slug: '50-ai-prompts-for-marketers',
      title: '50 AI Prompts for Marketers',
      description: 'A ready-to-use prompt library for campaign briefs, ad copy, and content outlines.',
      pages: 32,
      price: 12,
    },
  },
  {
    uid: 'seed-teacher-elena-rodriguez',
    name: 'Elena Rodriguez',
    email: 'elena.rodriguez@example.com',
    expertise: 'Brand & Visual Designer',
    experience: '10+ years',
    bio: 'A decade of building brand systems for consumer startups. Teaches marketers the design fundamentals they need to make their own campaigns look professional.',
    profileTemplate: 'minimal',
    coverFrom: '#db2777',
    coverTo: '#831843',
    course: {
      slug: 'brand-design-fundamentals-for-marketers',
      title: 'Brand Design Fundamentals for Marketers',
      summary: 'Typography, color, and layout basics so your campaigns stop looking homemade.',
      description:
        'A practical design course for marketers who aren’t designers: build a simple brand system and apply it consistently across every campaign you ship.',
      categorySlug: 'design',
      level: 'Beginner',
      price: 69,
      discountPercent: 0,
    },
    bootcamp: {
      slug: 'brand-systems-bootcamp',
      title: 'Brand Systems Bootcamp',
      tagline: 'Four weeks to a brand system your whole team can actually use.',
      description:
        'A live cohort-based bootcamp building a complete, reusable brand system — logo lockups, type scale, color, and templates.',
      durationWeeks: 4,
      cohortSize: 20,
      price: 599,
      nextCohortDate: '2026-11-16T00:00:00.000Z',
      applicationDeadline: '2026-11-05T00:00:00.000Z',
    },
  },
];

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  for (const teacher of demoTeachers) {
    const avatarPath = copySeedImage(SEED_AVATAR_SOURCE, join('avatars', `${teacher.uid}.jpg`));

    await prisma.user.upsert({
      where: { uid: teacher.uid },
      update: {
        name: teacher.name,
        expertise: teacher.expertise,
        experience: teacher.experience,
        bio: teacher.bio,
        profileTemplate: teacher.profileTemplate,
        avatarPath,
      },
      create: {
        uid: teacher.uid,
        email: teacher.email,
        name: teacher.name,
        role: 'teacher',
        phoneVerified: true,
        expertise: teacher.expertise,
        experience: teacher.experience,
        bio: teacher.bio,
        profileTemplate: teacher.profileTemplate,
        avatarPath,
      },
    });

    const courseCoverPath = copySeedImage(
      SEED_COVER_SOURCE,
      join('covers', 'courses', teacher.uid, 'seed-cover.png'),
    );

    await prisma.course.upsert({
      where: { slug: teacher.course.slug },
      update: { status: 'published', coverImagePath: courseCoverPath },
      create: {
        slug: teacher.course.slug,
        teacherUid: teacher.uid,
        title: teacher.course.title,
        summary: teacher.course.summary,
        description: teacher.course.description,
        categorySlug: teacher.course.categorySlug,
        level: teacher.course.level,
        price: teacher.course.price,
        discountPercent: teacher.course.discountPercent,
        marginPercent: 20,
        status: 'published',
        coverFrom: teacher.coverFrom,
        coverTo: teacher.coverTo,
        coverImagePath: courseCoverPath,
      },
    });

    if (teacher.ebook) {
      const ebookCoverPath = copySeedImage(
        SEED_COVER_SOURCE,
        join('covers', 'ebooks', teacher.uid, 'seed-cover.png'),
      );

      await prisma.ebook.upsert({
        where: { slug: teacher.ebook.slug },
        update: { status: 'published', coverImagePath: ebookCoverPath },
        create: {
          slug: teacher.ebook.slug,
          teacherUid: teacher.uid,
          title: teacher.ebook.title,
          description: teacher.ebook.description,
          format: 'pdf',
          price: teacher.ebook.price,
          marginPercent: 15,
          status: 'published',
          coverFrom: teacher.coverFrom,
          coverTo: teacher.coverTo,
          pages: teacher.ebook.pages,
          coverImagePath: ebookCoverPath,
        },
      });
    }

    if (teacher.bootcamp) {
      const bootcampCoverPath = copySeedImage(
        SEED_COVER_SOURCE,
        join('covers', 'bootcamps', teacher.uid, 'seed-cover.png'),
      );

      await prisma.bootcamp.upsert({
        where: { slug: teacher.bootcamp.slug },
        update: { status: 'published', coverImagePath: bootcampCoverPath },
        create: {
          slug: teacher.bootcamp.slug,
          teacherUid: teacher.uid,
          title: teacher.bootcamp.title,
          tagline: teacher.bootcamp.tagline,
          description: teacher.bootcamp.description,
          format: 'Live Online',
          price: teacher.bootcamp.price,
          marginPercent: 10,
          status: 'published',
          coverFrom: teacher.coverFrom,
          coverTo: teacher.coverTo,
          durationWeeks: teacher.bootcamp.durationWeeks,
          cohortSize: teacher.bootcamp.cohortSize,
          seatsRemaining: teacher.bootcamp.cohortSize,
          nextCohortDate: new Date(teacher.bootcamp.nextCohortDate),
          applicationDeadline: new Date(teacher.bootcamp.applicationDeadline),
          coverImagePath: bootcampCoverPath,
        },
      });
    }

    const existingBannerCount = await prisma.teacherBannerImage.count({ where: { teacherUid: teacher.uid } });
    if (existingBannerCount === 0) {
      const bannerSources = [SEED_COVER_SOURCE, SEED_AVATAR_SOURCE, SEED_COVER_SOURCE];
      for (let i = 0; i < bannerSources.length; i += 1) {
        const ext = bannerSources[i] === SEED_AVATAR_SOURCE ? 'jpg' : 'png';
        const bannerPath = copySeedImage(
          bannerSources[i],
          join('banners', teacher.uid, `seed-${i}.${ext}`),
        );
        await prisma.teacherBannerImage.create({
          data: { teacherUid: teacher.uid, imagePath: bannerPath, order: i },
        });
      }
    }

    const blogCoverPath = copySeedImage(
      SEED_COVER_SOURCE,
      join('covers', 'blog', teacher.uid, 'seed-cover.png'),
    );
    const blogSlug = 'why-i-teach-what-i-teach';
    await prisma.teacherBlogPost.upsert({
      where: { teacherUid_slug: { teacherUid: teacher.uid, slug: blogSlug } },
      update: {},
      create: {
        teacherUid: teacher.uid,
        slug: blogSlug,
        title: `Why I teach ${teacher.expertise}`,
        excerpt: `A few thoughts on why I moved from practicing ${teacher.expertise.toLowerCase()} full-time to teaching it — and what I want every student to walk away with.`,
        body: `${teacher.bio}\n\nI started teaching because I kept seeing the same gaps come up in marketing teams — not a lack of effort, but a lack of practical, hands-on training that actually matches the tools and constraints teams work with day to day.\n\nEvery course, ebook, and bootcamp I publish here is built around one rule: you should be able to apply it the same week you learn it. No filler, no theory for its own sake.\n\nIf you have questions about any of my courses or want to know if something is the right fit for where you're at, reach out through the contact form on this page — I read every message.`,
        coverImagePath: blogCoverPath,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
