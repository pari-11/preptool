import { PersonalisationCard } from '../PersonalisationCard';

export default function ProfilePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 px-4 py-8 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell PrepTool who you're preparing for so it can point you at the right things first.
        </p>
      </header>

      <PersonalisationCard />
    </div>
  );
}
