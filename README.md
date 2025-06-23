# Axiom - Developer Social Platform & Hackathon Hub

## Introduction 🏆  
Axiom was built following my experience as a hackathon participant in the **World’s Largest Hackathon**, presented by [Bolt](https://bolt.new). This global AI-powered hackathon, hosted online from **May 30 to June 30, 2025**, offered over **US $1,037,500** in prizes, including top awards of **$100,000**, **$75,000**, **$50,000**, down to **$10,000**, plus regional and bonus categories   
Participants built applications primarily using Bolt.new (with mandatory “Built with Bolt.new” badges), across various challenge tracks – AI, blockchain, monetization, voice/video, and even whimsical “Silly Sh!t” apps.  
The event spanned multiple global regions (AMER, APAC, EMEA), featured judge panels of industry leaders, and closed with winners announced around **July 26, 2025** .

---

## What is Axiom?

Axiom is a full-stack web application I developed to emulate the hackathon ecosystem I experienced:

- **Multi-role platform**: Developer, Organizer, Company, Admin — each with specific dashboards and permissions.
- **Hackathon Hub**: Browse and register for hackathons; organizers can post events with banners, tags, descriptions, timelines, etc.
- **Smart Team Formation**: Algorithm-based compatibility matching among participants.
- **Real-time Chat**: For team communication and coordination.
- **MMR & Leaderboards**: Hackathon-based ranking system and public leaderboards.

---

## Features

- **Authentication & Roles**: Signup/login flows with role-based access control.
- **Organizer Panel**: Create/manage hackathons with details mimicking Bolt-style event posts, integrated with database storage.
- **Developer Profiles**: Showcase skills, portfolio links, hackathon history, MMR ranking.
- **Team Matching**: Step-through onboarding and invitation process to form teams.
- **Live Communication**: Real-time chat via WebSockets/Supabase Realtime.
- **Event Listing**: Date-based sorting, filters by tags/location/status (“upcoming”, “live”, “ended”).

---

## Tech Stack

- **Frontend**: React (TypeScript) + Tailwind CSS  
- **Backend**: Node.js (Express) or Next.js API  
- **Database**: Supabase (PostgreSQL)  
- **Realtime**: Supabase Realtime / Socket.io  
- **Auth**: Supabase Auth (JWT)  
- **Storage**: Supabase Storage for images  
- **Deployment**: Vercel (frontend), Supabase (backend)

---

## Setup & Run Locally

```bash
git clone https://github.com/your-user/axiom.git
cd axiom
# Backend
cd backend
npm install
cp .env.example .env  # add Supabase credentials
npm run migrate && npm run seed
npm start
# Frontend
cd ../frontend
npm install
cp .env.example .env  # update API URL
npm run dev
