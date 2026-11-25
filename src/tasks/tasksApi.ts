import { getToken } from '../td/authProgress';
import { readApiJson, requestApiJson } from '../td/apiClient';

export type TaskReward = { coins: number; coinsMax?: number; experience: number; diamonds: number };

export type PlayerTask = {
  id: 'dailySignIn' | 'browse15' | 'dailyPractice' | 'levelClear' | 'chestOpen' | 'weeklyBrowse50' | 'weeklyPractice5';
  title: string;
  progress: number;
  target: number;
  complete: boolean;
  claimed: boolean;
  claimLabel?: string;
  reward: TaskReward;
};

export type TasksPayload = {
  daily: PlayerTask[];
  weekly: PlayerTask[];
  dailyPracticeRuns: number;
  wallet: { coins: number; diamonds: number; experience: number };
};

async function postTasks<T>(body: unknown, fallback: string) {
  const token = getToken();
  if (!token) throw new Error('请先登录账号');
  return requestApiJson<T>('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  }, fallback);
}

export async function fetchTasks() {
  const token = getToken();
  if (!token) throw new Error('请先登录账号');
  const response = await fetch('/api/tasks', { headers: { Authorization: `Bearer ${token}` } });
  return readApiJson<TasksPayload>(response, '任务加载失败');
}

export function recordBrowseTask(index: number) {
  return postTasks<Partial<TasksPayload>>({ action: 'browse', index }, '任务进度保存失败');
}

export type PracticeRun = { runId: string; questions: Array<{ itemId: string; options: string[] }> };

export function startDailyPracticeRun(restart = false) {
  return postTasks<PracticeRun>({ action: 'startDailyPractice', restart }, '练习加载失败');
}

export function completeDailyPractice(runId: string, answers: number[]) {
  return postTasks<Partial<TasksPayload>>({ action: 'completeDailyPractice', runId, answers }, '练习奖励发放失败');
}

export function claimTask(taskId: PlayerTask['id']) {
  return postTasks<TasksPayload>({ action: 'claim', taskId }, '任务领取失败');
}
