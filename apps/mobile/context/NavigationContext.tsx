import React, { createContext, useContext, useState, ReactNode } from "react";
import { OperatingMode } from "@const-ai/types";

export type ReviewTabType =
  | "Review"
  | "File"
  | "Browser"
  | "Explore"
  | "Plan"
  | "Side conversation"
  | "Terminal";

export interface SideTabItem {
  id: string;
  type: ReviewTabType;
  title: string;
  filename?: string;
  url?: string;
  isClosable?: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  timeAgo: string;
  isActive?: boolean;
  hasAwaitingApproval?: boolean;
}

export interface ProjectFolder {
  id: string;
  name: string;
  tasks: TaskItem[];
}

export interface WorkspaceItem {
  id: string;
  name: string;
  path: string;
  isCurrent?: boolean;
}

interface NavigationContextType {
  // Drawer & Panel States
  isTaskDrawerOpen: boolean;
  isReviewPanelOpen: boolean;
  isTerminalOpen: boolean;
  isWorkspaceModalOpen: boolean;
  isOverflowMenuOpen: boolean;
  isSettingsModalOpen: boolean;
  isOperatingModeModalOpen: boolean;
  isModelSelectorModalOpen: boolean;
  isContextMeterOpen: boolean;

  // Prompt Dock Modals & Input
  isPlusMenuOpen: boolean;
  isMentionOpen: boolean;
  isSlashCommandOpen: boolean;
  promptInput: string;

  // Active Session & Selections
  activeWorkspace: string;
  activeConversationId: string;
  activeTaskTitle: string;
  activeModel: string;
  activeOperatingMode: OperatingMode;
  activeReviewTab: ReviewTabType;
  filterMode: "group" | "project";

  // Multi-tab Side Panel
  openTabs: SideTabItem[];
  activeTabId: string;

  // Data Collections
  projects: ProjectFolder[];
  workspaces: WorkspaceItem[];

  // Actions
  toggleTaskDrawer: () => void;
  openTaskDrawer: () => void;
  closeTaskDrawer: () => void;

  toggleReviewPanel: () => void;
  openReviewPanel: () => void;
  closeReviewPanel: () => void;

  toggleTerminal: () => void;
  setTerminalOpen: (open: boolean) => void;

  setWorkspaceModalOpen: (open: boolean) => void;
  setOverflowMenuOpen: (open: boolean) => void;
  setSettingsModalOpen: (open: boolean) => void;
  setOperatingModeModalOpen: (open: boolean) => void;
  setModelSelectorModalOpen: (open: boolean) => void;
  setContextMeterOpen: (open: boolean) => void;

  setPlusMenuOpen: (open: boolean) => void;
  setMentionOpen: (open: boolean) => void;
  setSlashCommandOpen: (open: boolean) => void;
  setPromptInput: (text: string) => void;
  insertTextToPrompt: (text: string) => void;

  openSideTab: (tab: SideTabItem) => void;
  closeSideTab: (tabId: string) => void;
  setActiveTabId: (id: string) => void;

  setActiveWorkspace: (workspace: string) => void;
  setActiveConversationId: (id: string) => void;
  setActiveTaskTitle: (title: string) => void;
  setActiveModel: (model: string) => void;
  setActiveOperatingMode: (mode: OperatingMode) => void;
  setActiveReviewTab: (tab: ReviewTabType) => void;
  setFilterMode: (mode: "group" | "project") => void;

  selectTask: (task: TaskItem) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

const INITIAL_PROJECTS: ProjectFolder[] = [
  {
    id: "proj-1",
    name: "const-ai-mobile",
    tasks: [],
  },
  {
    id: "proj-2",
    name: "Gemini 3.6 Flash",
    tasks: [
      {
        id: "task-101",
        title: "Clone Project Gargantua dengan UI Baru",
        projectId: "proj-2",
        projectName: "Gemini 3.6 Flash",
        timeAgo: "now",
        isActive: true,
        hasAwaitingApproval: true,
      },
      {
        id: "task-102",
        title: "Kloning Gargantua dengan preset interstellar",
        projectId: "proj-2",
        projectName: "Gemini 3.6 Flash",
        timeAgo: "22h",
      },
      {
        id: "task-103",
        title: "Gargantua Schwarzschild Blackhole Shader",
        projectId: "proj-2",
        projectName: "Gemini 3.6 Flash",
        timeAgo: "22h",
      },
      {
        id: "task-104",
        title: "Pembuatan Game 3D Procedural Space",
        projectId: "proj-2",
        projectName: "Gemini 3.6 Flash",
        timeAgo: "23h",
      },
      {
        id: "task-105",
        title: "Landing Page Portofolio Interaktif",
        projectId: "proj-2",
        projectName: "Gemini 3.6 Flash",
        timeAgo: "23h",
      },
    ],
  },
  {
    id: "proj-3",
    name: "Java",
    tasks: [
      {
        id: "task-201",
        title: "Kurikulum Pembelajaran Java Spring Boot",
        projectId: "proj-3",
        projectName: "Java",
        timeAgo: "3d",
      },
      {
        id: "task-202",
        title: "Selection side chat & API Gateway",
        projectId: "proj-3",
        projectName: "Java",
        timeAgo: "3d",
      },
    ],
  },
];

const INITIAL_WORKSPACES: WorkspaceItem[] = [
  { id: "ws-1", name: "const-ai-mobile", path: "D:/code/platform/const-ai-mobile" },
  { id: "ws-2", name: "Gemini 3.6 Flash", path: "D:/code/projects/gemini-flash", isCurrent: true },
  { id: "ws-3", name: "Java", path: "D:/code/enterprise/java-core" },
];

const INITIAL_TABS: SideTabItem[] = [
  {
    id: "tab-file-server",
    type: "File",
    title: "server.js",
    filename: "server.js",
    isClosable: true,
  },
  {
    id: "tab-browser",
    type: "Browser",
    title: "localhost:8000",
    url: "http://localhost:8000/",
    isClosable: true,
  },
  {
    id: "tab-review",
    type: "Review",
    title: "Review",
    isClosable: false,
  },
  {
    id: "tab-explore",
    type: "Explore",
    title: "Explore",
    isClosable: false,
  },
  {
    id: "tab-plan",
    type: "Plan",
    title: "Plan",
    isClosable: false,
  },
];

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [isReviewPanelOpen, setIsReviewPanelOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isOverflowMenuOpen, setIsOverflowMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isOperatingModeModalOpen, setIsOperatingModeModalOpen] = useState(false);
  const [isModelSelectorModalOpen, setIsModelSelectorModalOpen] = useState(false);
  const [isContextMeterOpen, setIsContextMeterOpen] = useState(false);

  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isMentionOpen, setIsMentionOpen] = useState(false);
  const [isSlashCommandOpen, setIsSlashCommandOpen] = useState(false);
  const [promptInput, setPromptInput] = useState("");

  const [activeWorkspace, setActiveWorkspace] = useState<string>("Gemini 3.6 Flash");
  const [activeConversationId, setActiveConversationId] = useState<string>("task-101");
  const [activeTaskTitle, setActiveTaskTitle] = useState<string>(
    "Clone Project Gargantua dengan UI Baru"
  );
  const [activeModel, setActiveModel] = useState<string>("Gemini 3.7 Flash High");
  const [activeOperatingMode, setActiveOperatingMode] = useState<OperatingMode>("full_access_yolo");
  const [activeReviewTab, setActiveReviewTab] = useState<ReviewTabType>("File");
  const [filterMode, setFilterMode] = useState<"group" | "project">("project");

  const [openTabs, setOpenTabs] = useState<SideTabItem[]>(INITIAL_TABS);
  const [activeTabId, setActiveTabId] = useState<string>("tab-file-server");

  const [projects] = useState<ProjectFolder[]>(INITIAL_PROJECTS);
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>(INITIAL_WORKSPACES);

  const toggleTaskDrawer = () => setIsTaskDrawerOpen((prev) => !prev);
  const openTaskDrawer = () => setIsTaskDrawerOpen(true);
  const closeTaskDrawer = () => setIsTaskDrawerOpen(false);

  const toggleReviewPanel = () => setIsReviewPanelOpen((prev) => !prev);
  const openReviewPanel = () => setIsReviewPanelOpen(true);
  const closeReviewPanel = () => setIsReviewPanelOpen(false);

  const toggleTerminal = () => setIsTerminalOpen((prev) => !prev);
  const setTerminalOpen = (open: boolean) => setIsTerminalOpen(open);

  const selectTask = (task: TaskItem) => {
    setActiveConversationId(task.id);
    setActiveTaskTitle(task.title);
    setActiveWorkspace(task.projectName);
    setIsTaskDrawerOpen(false);
  };

  const handleSetWorkspace = (workspaceName: string) => {
    setActiveWorkspace(workspaceName);
    setWorkspaces((prev) =>
      prev.map((ws) => ({
        ...ws,
        isCurrent: ws.name === workspaceName,
      }))
    );
  };

  const openSideTab = (tab: SideTabItem) => {
    setOpenTabs((prev) => {
      const existing = prev.find((t) => t.id === tab.id || (t.type === tab.type && t.title === tab.title));
      if (existing) {
        return prev;
      }
      return [...prev, tab];
    });
    setActiveTabId(tab.id);
    setActiveReviewTab(tab.type);
    setIsReviewPanelOpen(true);
  };

  const closeSideTab = (tabId: string) => {
    setOpenTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId && filtered.length > 0) {
        setActiveTabId(filtered[0].id);
        setActiveReviewTab(filtered[0].type);
      }
      return filtered;
    });
  };

  const insertTextToPrompt = (text: string) => {
    setPromptInput((prev) => {
      if (prev.endsWith("@") || prev.endsWith("/")) {
        return prev.slice(0, -1) + text;
      }
      return prev ? `${prev} ${text}` : text;
    });
  };

  return (
    <NavigationContext.Provider
      value={{
        isTaskDrawerOpen,
        isReviewPanelOpen,
        isTerminalOpen,
        isWorkspaceModalOpen,
        isOverflowMenuOpen,
        isSettingsModalOpen,
        isOperatingModeModalOpen,
        isModelSelectorModalOpen,
        isContextMeterOpen,

        isPlusMenuOpen,
        isMentionOpen,
        isSlashCommandOpen,
        promptInput,

        activeWorkspace,
        activeConversationId,
        activeTaskTitle,
        activeModel,
        activeOperatingMode,
        activeReviewTab,
        filterMode,

        openTabs,
        activeTabId,

        projects,
        workspaces,

        toggleTaskDrawer,
        openTaskDrawer,
        closeTaskDrawer,

        toggleReviewPanel,
        openReviewPanel,
        closeReviewPanel,

        toggleTerminal,
        setTerminalOpen,

        setWorkspaceModalOpen: setIsWorkspaceModalOpen,
        setOverflowMenuOpen: setIsOverflowMenuOpen,
        setSettingsModalOpen: setIsSettingsModalOpen,
        setOperatingModeModalOpen: setIsOperatingModeModalOpen,
        setModelSelectorModalOpen: setIsModelSelectorModalOpen,
        setContextMeterOpen: setIsContextMeterOpen,

        setPlusMenuOpen: setIsPlusMenuOpen,
        setMentionOpen: setIsMentionOpen,
        setSlashCommandOpen: setIsSlashCommandOpen,
        setPromptInput,
        insertTextToPrompt,

        openSideTab,
        closeSideTab,
        setActiveTabId: (id: string) => {
          setActiveTabId(id);
          const current = openTabs.find((t) => t.id === id);
          if (current) {
            setActiveReviewTab(current.type);
          }
        },

        setActiveWorkspace: handleSetWorkspace,
        setActiveConversationId,
        setActiveTaskTitle,
        setActiveModel,
        setActiveOperatingMode,
        setActiveReviewTab,
        setFilterMode,

        selectTask,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
};
