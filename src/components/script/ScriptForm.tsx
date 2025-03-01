
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HookStructureUploader } from "./HookStructureUploader";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ScriptFormProps {
  scriptType: "existing" | "custom";
  setScriptType: (type: "existing" | "custom") => void;
  toneOfVoice: string;
  setToneOfVoice: (tone: string) => void;
  duration: string;
  setDuration: (duration: string) => void;
  additionalNotes: string;
  setAdditionalNotes: (notes: string) => void;
  selectedHook: string | null;
  setSelectedHook: (hook: string | null) => void;
  selectedStructure: string | null;
  setSelectedStructure: (structure: string | null) => void;
  hooks: Array<{
    id?: string;
    hook: string;
    category: string;
    description?: string;
  }>;
  structures: Array<{
    id?: string;
    name: string;
    structure: string;
    description?: string;
  }>;
  fetchHooksAndStructures: () => Promise<void>;
}

export function ScriptForm({
  scriptType,
  setScriptType,
  toneOfVoice,
  setToneOfVoice,
  duration,
  setDuration,
  additionalNotes,
  setAdditionalNotes,
  selectedHook,
  setSelectedHook,
  selectedStructure,
  setSelectedStructure,
  hooks,
  structures,
  fetchHooksAndStructures
}: ScriptFormProps) {
  return (
    <>
      <div className="space-y-4">
        <Label>Choose your starting point</Label>
        <RadioGroup
          value={scriptType}
          onValueChange={(value) => setScriptType(value as "existing" | "custom")}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="existing" id="existing" />
            <Label htmlFor="existing">Use an existing idea</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="custom" id="custom" />
            <Label htmlFor="custom">Create a custom idea</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-4 pt-4">
        <div>
          <Label htmlFor="toneOfVoice">Tone of Voice</Label>
          <Select value={toneOfVoice} onValueChange={setToneOfVoice}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="conversational">Conversational</SelectItem>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="energetic">Energetic</SelectItem>
              <SelectItem value="humorous">Humorous</SelectItem>
              <SelectItem value="educational">Educational</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="duration">Target Duration (seconds)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 seconds</SelectItem>
              <SelectItem value="60">60 seconds</SelectItem>
              <SelectItem value="90">90 seconds</SelectItem>
              <SelectItem value="120">2 minutes</SelectItem>
              <SelectItem value="180">3 minutes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="additionalNotes">Additional Notes</Label>
          <Textarea
            id="additionalNotes"
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any specific requirements or points to include in the script"
          />
        </div>
        
        {/* Hook and Structure dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="selectedHook">Opening Hook (Optional)</Label>
            <Select value={selectedHook || "none"} onValueChange={setSelectedHook}>
              <SelectTrigger>
                <SelectValue placeholder="Select a hook" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No hook</SelectItem>
                {hooks.map((hook) => (
                  <SelectItem key={hook.id} value={hook.id || ""}>
                    {hook.category}: {hook.hook.substring(0, 30)}...
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="selectedStructure">Script Structure (Optional)</Label>
            <Select value={selectedStructure || "none"} onValueChange={setSelectedStructure}>
              <SelectTrigger>
                <SelectValue placeholder="Select a structure" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No structure</SelectItem>
                {structures.map((structure) => (
                  <SelectItem key={structure.id} value={structure.id || ""}>
                    {structure.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Upload hooks and structures section */}
        <HookStructureUploader fetchHooksAndStructures={fetchHooksAndStructures} />
      </div>
    </>
  );
}
