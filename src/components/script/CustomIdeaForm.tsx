
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomIdeaFormProps {
  customTitle: string;
  setCustomTitle: (title: string) => void;
  customDescription: string;
  setCustomDescription: (description: string) => void;
}

export function CustomIdeaForm({
  customTitle,
  setCustomTitle,
  customDescription,
  setCustomDescription
}: CustomIdeaFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="customTitle">Title</Label>
        <Input
          id="customTitle"
          value={customTitle}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="Enter your video title"
        />
      </div>
      <div>
        <Label htmlFor="customDescription">Description</Label>
        <Textarea
          id="customDescription"
          value={customDescription}
          onChange={(e) => setCustomDescription(e.target.value)}
          placeholder="Describe your video concept"
        />
      </div>
    </div>
  );
}
