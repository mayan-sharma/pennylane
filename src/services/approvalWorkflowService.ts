/**
 * Expense Approval Workflow Service
 * Handles multi-level approval processes for expense management
 * Supports role-based approvals, delegation, and automated routing
 */

import { Expense, ExpenseCategory } from '../types';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'finance' | 'admin';
  department: string;
  managerId?: string;
  permissions: Permission[];
  isActive: boolean;
}

export interface Permission {
  type: 'approve' | 'reject' | 'delegate' | 'view' | 'edit';
  scope: 'own' | 'team' | 'department' | 'all';
  conditions?: {
    maxAmount?: number;
    categories?: ExpenseCategory[];
    departments?: string[];
  };
}

export interface ApprovalStep {
  id: string;
  order: number;
  type: 'user' | 'role' | 'amount_based' | 'category_based' | 'automatic';
  approverIds?: string[];
  roles?: string[];
  conditions?: {
    minAmount?: number;
    maxAmount?: number;
    categories?: ExpenseCategory[];
    departments?: string[];
  };
  isRequired: boolean;
  allowParallelApproval: boolean;
  timeoutDays?: number;
  escalationUserId?: string;
  autoApprove?: boolean;
  autoApproveConditions?: {
    maxAmount?: number;
    trustedMerchants?: string[];
    recurringExpenses?: boolean;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  department?: string;
  isDefault: boolean;
  isActive: boolean;
  steps: ApprovalStep[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  conditions?: {
    minAmount?: number;
    maxAmount?: number;
    categories?: ExpenseCategory[];
    departments?: string[];
  };
}

export interface ExpenseApproval {
  id: string;
  expenseId: string;
  workflowTemplateId: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'escalated';
  submittedBy: string;
  submittedAt: string;
  completedAt?: string;
  currentStepId?: string;
  steps: ApprovalStepInstance[];
  comments: ApprovalComment[];
  rejectionReason?: string;
  escalationReason?: string;
  isUrgent: boolean;
  metadata?: {
    originalAmount?: number;
    modifiedAmount?: number;
    modifiedFields?: string[];
    autoProcessed?: boolean;
  };
}

export interface ApprovalStepInstance {
  id: string;
  stepId: string;
  order: number;
  status: 'pending' | 'approved' | 'rejected' | 'skipped' | 'escalated' | 'timeout';
  assignedTo: string[];
  approvedBy?: string;
  rejectedBy?: string;
  processedAt?: string;
  comments?: string;
  timeoutAt?: string;
  isOverride?: boolean;
  delegatedFrom?: string;
  delegatedTo?: string;
}

export interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
  type: 'comment' | 'approval' | 'rejection' | 'escalation' | 'delegation';
  isInternal: boolean;
  attachments?: string[];
}

export interface ApprovalStats {
  totalApprovals: number;
  pendingApprovals: number;
  approvedToday: number;
  rejectedToday: number;
  averageApprovalTime: number; // in hours
  overdueApprovals: number;
  byStatus: Record<string, number>;
  byCategory: Record<ExpenseCategory, number>;
  topApprovers: { userId: string; userName: string; count: number }[];
  escalationRate: number;
}

export interface ApprovalNotification {
  id: string;
  type: 'approval_request' | 'approval_approved' | 'approval_rejected' | 'approval_escalated' | 'approval_reminder';
  userId: string;
  expenseId: string;
  approvalId: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  readAt?: string;
  actionUrl?: string;
  metadata?: any;
}

class ApprovalWorkflowService {
  private users: User[] = [];
  private workflows: WorkflowTemplate[] = [];
  private approvals: ExpenseApproval[] = [];
  private notifications: ApprovalNotification[] = [];
  private currentUser: User | null = null;

  constructor() {
    this.loadStoredData();
    this.initializeDefaultData();
  }

  // === User Management ===

  async setCurrentUser(user: User): Promise<void> {
    this.currentUser = user;
    this.saveStoredData();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  async createUser(userData: Omit<User, 'id'>): Promise<User> {
    const user: User = {
      ...userData,
      id: crypto.randomUUID(),
    };

    this.users.push(user);
    this.saveStoredData();
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<void> {
    const user = this.users.find(u => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      this.saveStoredData();
    }
  }

  getUsers(): User[] {
    return [...this.users];
  }

  getUserById(userId: string): User | undefined {
    return this.users.find(u => u.id === userId);
  }

  getUsersByRole(role: string): User[] {
    return this.users.filter(u => u.role === role && u.isActive);
  }

  getUsersByDepartment(department: string): User[] {
    return this.users.filter(u => u.department === department && u.isActive);
  }

  // === Workflow Template Management ===

  async createWorkflowTemplate(templateData: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowTemplate> {
    const template: WorkflowTemplate = {
      ...templateData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.workflows.push(template);
    this.saveStoredData();
    return template;
  }

  async updateWorkflowTemplate(templateId: string, updates: Partial<WorkflowTemplate>): Promise<void> {
    const template = this.workflows.find(w => w.id === templateId);
    if (template) {
      Object.assign(template, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      this.saveStoredData();
    }
  }

  async deleteWorkflowTemplate(templateId: string): Promise<void> {
    this.workflows = this.workflows.filter(w => w.id !== templateId);
    this.saveStoredData();
  }

  getWorkflowTemplates(): WorkflowTemplate[] {
    return [...this.workflows];
  }

  getWorkflowTemplateById(templateId: string): WorkflowTemplate | undefined {
    return this.workflows.find(w => w.id === templateId);
  }

  // === Expense Approval Process ===

  async submitExpenseForApproval(expense: Expense, isUrgent = false): Promise<ExpenseApproval> {
    if (!this.currentUser) {
      throw new Error('No current user set');
    }

    // Find appropriate workflow template
    const workflowTemplate = this.findWorkflowTemplate(expense, this.currentUser);
    if (!workflowTemplate) {
      throw new Error('No suitable workflow template found');
    }

    // Create approval instance
    const approval: ExpenseApproval = {
      id: crypto.randomUUID(),
      expenseId: expense.id,
      workflowTemplateId: workflowTemplate.id,
      status: 'pending',
      submittedBy: this.currentUser.id,
      submittedAt: new Date().toISOString(),
      steps: [],
      comments: [],
      isUrgent,
    };

    // Create step instances
    approval.steps = await this.createStepInstances(workflowTemplate.steps, expense, this.currentUser);

    // Set current step
    const firstStep = approval.steps.find(s => s.status === 'pending');
    if (firstStep) {
      approval.currentStepId = firstStep.id;
    }

    // Check for auto-approval
    const autoApprovedStep = approval.steps.find(s => s.status === 'approved');
    if (autoApprovedStep) {
      approval.status = 'approved';
      approval.completedAt = new Date().toISOString();
    }

    this.approvals.push(approval);
    this.saveStoredData();

    // Send notifications
    await this.sendApprovalNotifications(approval);

    return approval;
  }

  async processApproval(
    approvalId: string,
    stepId: string,
    action: 'approve' | 'reject' | 'delegate',
    comments?: string,
    delegateToUserId?: string
  ): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No current user set');
    }

    const approval = this.approvals.find(a => a.id === approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    const step = approval.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('Approval step not found');
    }

    // Verify user has permission to process this step
    if (!step.assignedTo.includes(this.currentUser.id)) {
      throw new Error('User not authorized to process this step');
    }

    // Process the action
    switch (action) {
      case 'approve':
        step.status = 'approved';
        step.approvedBy = this.currentUser.id;
        step.processedAt = new Date().toISOString();
        break;

      case 'reject':
        step.status = 'rejected';
        step.rejectedBy = this.currentUser.id;
        step.processedAt = new Date().toISOString();
        approval.status = 'rejected';
        approval.rejectionReason = comments;
        approval.completedAt = new Date().toISOString();
        break;

      case 'delegate':
        if (!delegateToUserId) {
          throw new Error('Delegate user ID is required');
        }
        step.delegatedFrom = this.currentUser.id;
        step.delegatedTo = delegateToUserId;
        step.assignedTo = [delegateToUserId];
        break;
    }

    // Add comment
    if (comments) {
      approval.comments.push({
        id: crypto.randomUUID(),
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        comment: comments,
        timestamp: new Date().toISOString(),
        type: action,
        isInternal: false,
      });
    }

    // Update approval status and move to next step
    if (action === 'approve' && approval.status === 'pending') {
      await this.moveToNextStep(approval);
    }

    this.saveStoredData();

    // Send notifications
    await this.sendProcessingNotifications(approval, step, action);
  }

  async escalateApproval(approvalId: string, reason: string): Promise<void> {
    const approval = this.approvals.find(a => a.id === approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    const currentStep = approval.steps.find(s => s.id === approval.currentStepId);
    if (!currentStep) {
      throw new Error('Current step not found');
    }

    // Find escalation user
    const workflowTemplate = this.getWorkflowTemplateById(approval.workflowTemplateId);
    const templateStep = workflowTemplate?.steps.find(s => s.id === currentStep.stepId);
    
    if (templateStep?.escalationUserId) {
      currentStep.status = 'escalated';
      currentStep.assignedTo = [templateStep.escalationUserId];
      approval.escalationReason = reason;

      // Add escalation comment
      approval.comments.push({
        id: crypto.randomUUID(),
        userId: 'system',
        userName: 'System',
        comment: `Escalated: ${reason}`,
        timestamp: new Date().toISOString(),
        type: 'escalation',
        isInternal: true,
      });

      this.saveStoredData();

      // Send escalation notifications
      await this.sendEscalationNotifications(approval, reason);
    }
  }

  async cancelApproval(approvalId: string, reason: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('No current user set');
    }

    const approval = this.approvals.find(a => a.id === approvalId);
    if (!approval) {
      throw new Error('Approval not found');
    }

    // Only submitter or admin can cancel
    if (approval.submittedBy !== this.currentUser.id && this.currentUser.role !== 'admin') {
      throw new Error('Not authorized to cancel this approval');
    }

    approval.status = 'cancelled';
    approval.completedAt = new Date().toISOString();

    // Add cancellation comment
    approval.comments.push({
      id: crypto.randomUUID(),
      userId: this.currentUser.id,
      userName: this.currentUser.name,
      comment: `Cancelled: ${reason}`,
      timestamp: new Date().toISOString(),
      type: 'comment',
      isInternal: false,
    });

    this.saveStoredData();
  }

  // === Query Methods ===

  getApprovalById(approvalId: string): ExpenseApproval | undefined {
    return this.approvals.find(a => a.id === approvalId);
  }

  getApprovalsByExpense(expenseId: string): ExpenseApproval[] {
    return this.approvals.filter(a => a.expenseId === expenseId);
  }

  getPendingApprovalsForUser(userId: string): ExpenseApproval[] {
    return this.approvals.filter(approval => 
      approval.status === 'pending' &&
      approval.steps.some(step => 
        step.status === 'pending' && step.assignedTo.includes(userId)
      )
    );
  }

  getSubmittedApprovalsByUser(userId: string): ExpenseApproval[] {
    return this.approvals.filter(a => a.submittedBy === userId);
  }

  getApprovalStats(): ApprovalStats {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalApprovals = this.approvals.length;
    const pendingApprovals = this.approvals.filter(a => a.status === 'pending').length;
    
    const todayApprovals = this.approvals.filter(a => 
      a.completedAt && new Date(a.completedAt) >= today
    );
    const approvedToday = todayApprovals.filter(a => a.status === 'approved').length;
    const rejectedToday = todayApprovals.filter(a => a.status === 'rejected').length;

    // Calculate average approval time
    const completedApprovals = this.approvals.filter(a => a.completedAt);
    const totalApprovalTime = completedApprovals.reduce((total, approval) => {
      const start = new Date(approval.submittedAt);
      const end = new Date(approval.completedAt!);
      return total + (end.getTime() - start.getTime());
    }, 0);
    const averageApprovalTime = completedApprovals.length > 0 
      ? totalApprovalTime / completedApprovals.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Count overdue approvals (pending for more than workflow timeout)
    const overdueApprovals = this.approvals.filter(approval => {
      if (approval.status !== 'pending') return false;
      const currentStep = approval.steps.find(s => s.id === approval.currentStepId);
      if (!currentStep?.timeoutAt) return false;
      return new Date(currentStep.timeoutAt) < now;
    }).length;

    const byStatus = this.approvals.reduce((acc, approval) => {
      acc[approval.status] = (acc[approval.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top approvers
    const approverCounts = new Map<string, number>();
    this.approvals.forEach(approval => {
      approval.steps.forEach(step => {
        if (step.approvedBy) {
          approverCounts.set(step.approvedBy, (approverCounts.get(step.approvedBy) || 0) + 1);
        }
      });
    });

    const topApprovers = Array.from(approverCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => ({
        userId,
        userName: this.getUserById(userId)?.name || 'Unknown',
        count,
      }));

    const escalatedCount = this.approvals.filter(a => 
      a.steps.some(s => s.status === 'escalated')
    ).length;
    const escalationRate = totalApprovals > 0 ? escalatedCount / totalApprovals : 0;

    return {
      totalApprovals,
      pendingApprovals,
      approvedToday,
      rejectedToday,
      averageApprovalTime,
      overdueApprovals,
      byStatus,
      byCategory: {} as Record<ExpenseCategory, number>, // Would need expense data
      topApprovers,
      escalationRate,
    };
  }

  // === Helper Methods ===

  private findWorkflowTemplate(expense: Expense, user: User): WorkflowTemplate | undefined {
    // Find templates that match the expense criteria
    const candidates = this.workflows
      .filter(w => w.isActive)
      .filter(w => {
        if (w.department && w.department !== user.department) return false;
        if (w.conditions?.minAmount && expense.amount < w.conditions.minAmount) return false;
        if (w.conditions?.maxAmount && expense.amount > w.conditions.maxAmount) return false;
        if (w.conditions?.categories && !w.conditions.categories.includes(expense.category)) return false;
        if (w.conditions?.departments && !w.conditions.departments.includes(user.department)) return false;
        return true;
      })
      .sort((a, b) => {
        // Prioritize more specific templates
        const aSpecificity = (a.conditions?.categories?.length || 0) + 
                           (a.conditions?.departments?.length || 0) + 
                           (a.department ? 1 : 0);
        const bSpecificity = (b.conditions?.categories?.length || 0) + 
                           (b.conditions?.departments?.length || 0) + 
                           (b.department ? 1 : 0);
        return bSpecificity - aSpecificity;
      });

    // Return the most specific match, or default template
    return candidates[0] || this.workflows.find(w => w.isDefault && w.isActive);
  }

  private async createStepInstances(
    templateSteps: ApprovalStep[],
    expense: Expense,
    submitter: User
  ): Promise<ApprovalStepInstance[]> {
    const stepInstances: ApprovalStepInstance[] = [];

    for (const templateStep of templateSteps.sort((a, b) => a.order - b.order)) {
      // Check if step applies to this expense
      if (!this.stepApplies(templateStep, expense, submitter)) {
        continue;
      }

      // Determine assignees
      const assignedTo = await this.getStepAssignees(templateStep, expense, submitter);
      if (assignedTo.length === 0) {
        continue; // Skip steps with no assignees
      }

      // Check for auto-approval
      const shouldAutoApprove = this.shouldAutoApprove(templateStep, expense);

      const stepInstance: ApprovalStepInstance = {
        id: crypto.randomUUID(),
        stepId: templateStep.id,
        order: templateStep.order,
        status: shouldAutoApprove ? 'approved' : 'pending',
        assignedTo,
        processedAt: shouldAutoApprove ? new Date().toISOString() : undefined,
        timeoutAt: templateStep.timeoutDays ? 
          new Date(Date.now() + templateStep.timeoutDays * 24 * 60 * 60 * 1000).toISOString() :
          undefined,
      };

      stepInstances.push(stepInstance);

      // If not parallel approval and this step is pending, stop here
      if (!templateStep.allowParallelApproval && !shouldAutoApprove) {
        break;
      }
    }

    return stepInstances;
  }

  private stepApplies(step: ApprovalStep, expense: Expense, user: User): boolean {
    if (step.conditions?.minAmount && expense.amount < step.conditions.minAmount) return false;
    if (step.conditions?.maxAmount && expense.amount > step.conditions.maxAmount) return false;
    if (step.conditions?.categories && !step.conditions.categories.includes(expense.category)) return false;
    if (step.conditions?.departments && !step.conditions.departments.includes(user.department)) return false;
    return true;
  }

  private async getStepAssignees(step: ApprovalStep, expense: Expense, submitter: User): Promise<string[]> {
    const assignees: string[] = [];

    // Direct user assignments
    if (step.approverIds) {
      assignees.push(...step.approverIds);
    }

    // Role-based assignments
    if (step.roles) {
      for (const role of step.roles) {
        const users = this.getUsersByRole(role);
        assignees.push(...users.map(u => u.id));
      }
    }

    // Special logic for manager approval
    if (step.type === 'user' && submitter.managerId) {
      assignees.push(submitter.managerId);
    }

    // Remove duplicates and inactive users
    return [...new Set(assignees)].filter(id => {
      const user = this.getUserById(id);
      return user?.isActive;
    });
  }

  private shouldAutoApprove(step: ApprovalStep, expense: Expense): boolean {
    if (!step.autoApprove || !step.autoApproveConditions) return false;

    const conditions = step.autoApproveConditions;
    
    if (conditions.maxAmount && expense.amount > conditions.maxAmount) return false;
    if (conditions.trustedMerchants && expense.merchant && 
        !conditions.trustedMerchants.includes(expense.merchant)) return false;
    if (conditions.recurringExpenses && !expense.isRecurring) return false;

    return true;
  }

  private async moveToNextStep(approval: ExpenseApproval): Promise<void> {
    const currentStepIndex = approval.steps.findIndex(s => s.id === approval.currentStepId);
    
    // Find next pending step
    const nextStep = approval.steps
      .slice(currentStepIndex + 1)
      .find(s => s.status === 'pending');

    if (nextStep) {
      approval.currentStepId = nextStep.id;
    } else {
      // No more steps - approval is complete
      approval.status = 'approved';
      approval.completedAt = new Date().toISOString();
    }
  }

  // === Notification Methods ===

  private async sendApprovalNotifications(approval: ExpenseApproval): Promise<void> {
    const currentStep = approval.steps.find(s => s.id === approval.currentStepId);
    if (!currentStep) return;

    for (const assigneeId of currentStep.assignedTo) {
      const notification: ApprovalNotification = {
        id: crypto.randomUUID(),
        type: 'approval_request',
        userId: assigneeId,
        expenseId: approval.expenseId,
        approvalId: approval.id,
        title: 'New Expense Approval Request',
        message: `You have a new expense approval request from ${this.getUserById(approval.submittedBy)?.name}`,
        priority: approval.isUrgent ? 'urgent' : 'medium',
        createdAt: new Date().toISOString(),
        actionUrl: `/approvals/${approval.id}`,
      };

      this.notifications.push(notification);
    }

    this.saveStoredData();
  }

  private async sendProcessingNotifications(
    approval: ExpenseApproval,
    step: ApprovalStepInstance,
    action: string
  ): Promise<void> {
    const notification: ApprovalNotification = {
      id: crypto.randomUUID(),
      type: `approval_${action}` as any,
      userId: approval.submittedBy,
      expenseId: approval.expenseId,
      approvalId: approval.id,
      title: `Expense ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Your expense has been ${action} by ${this.currentUser?.name}`,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      actionUrl: `/approvals/${approval.id}`,
    };

    this.notifications.push(notification);
    this.saveStoredData();
  }

  private async sendEscalationNotifications(approval: ExpenseApproval, reason: string): Promise<void> {
    const currentStep = approval.steps.find(s => s.id === approval.currentStepId);
    if (!currentStep) return;

    for (const assigneeId of currentStep.assignedTo) {
      const notification: ApprovalNotification = {
        id: crypto.randomUUID(),
        type: 'approval_escalated',
        userId: assigneeId,
        expenseId: approval.expenseId,
        approvalId: approval.id,
        title: 'Escalated Expense Approval',
        message: `An expense approval has been escalated to you. Reason: ${reason}`,
        priority: 'high',
        createdAt: new Date().toISOString(),
        actionUrl: `/approvals/${approval.id}`,
      };

      this.notifications.push(notification);
    }

    this.saveStoredData();
  }

  // === Notification Management ===

  getNotificationsForUser(userId: string): ApprovalNotification[] {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markNotificationAsRead(notificationId: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.readAt = new Date().toISOString();
      this.saveStoredData();
    }
  }

  // === Data Persistence ===

  private loadStoredData(): void {
    try {
      const storedUsers = localStorage.getItem('approval_users');
      if (storedUsers) {
        this.users = JSON.parse(storedUsers);
      }

      const storedWorkflows = localStorage.getItem('approval_workflows');
      if (storedWorkflows) {
        this.workflows = JSON.parse(storedWorkflows);
      }

      const storedApprovals = localStorage.getItem('approval_approvals');
      if (storedApprovals) {
        this.approvals = JSON.parse(storedApprovals);
      }

      const storedNotifications = localStorage.getItem('approval_notifications');
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      }

      const storedCurrentUser = localStorage.getItem('approval_current_user');
      if (storedCurrentUser) {
        this.currentUser = JSON.parse(storedCurrentUser);
      }
    } catch (error) {
      console.error('Failed to load approval workflow data:', error);
    }
  }

  private saveStoredData(): void {
    try {
      localStorage.setItem('approval_users', JSON.stringify(this.users));
      localStorage.setItem('approval_workflows', JSON.stringify(this.workflows));
      localStorage.setItem('approval_approvals', JSON.stringify(this.approvals));
      localStorage.setItem('approval_notifications', JSON.stringify(this.notifications));
      if (this.currentUser) {
        localStorage.setItem('approval_current_user', JSON.stringify(this.currentUser));
      }
    } catch (error) {
      console.error('Failed to save approval workflow data:', error);
    }
  }

  private initializeDefaultData(): void {
    if (this.users.length === 0) {
      // Create sample users
      const sampleUsers: Omit<User, 'id'>[] = [
        {
          name: 'John Employee',
          email: 'john@company.com',
          role: 'employee',
          department: 'Engineering',
          permissions: [
            { type: 'view', scope: 'own' },
            { type: 'edit', scope: 'own' },
          ],
          isActive: true,
        },
        {
          name: 'Sarah Manager',
          email: 'sarah@company.com',
          role: 'manager',
          department: 'Engineering',
          permissions: [
            { type: 'approve', scope: 'team', conditions: { maxAmount: 1000 } },
            { type: 'view', scope: 'team' },
          ],
          isActive: true,
        },
        {
          name: 'Mike Finance',
          email: 'mike@company.com',
          role: 'finance',
          department: 'Finance',
          permissions: [
            { type: 'approve', scope: 'all' },
            { type: 'view', scope: 'all' },
          ],
          isActive: true,
        },
      ];

      for (const userData of sampleUsers) {
        this.createUser(userData);
      }

      // Set manager relationships
      const john = this.users.find(u => u.name === 'John Employee');
      const sarah = this.users.find(u => u.name === 'Sarah Manager');
      if (john && sarah) {
        john.managerId = sarah.id;
      }
    }

    if (this.workflows.length === 0) {
      // Create default workflow
      const defaultWorkflow: Omit<WorkflowTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
        name: 'Standard Approval Workflow',
        description: 'Default approval workflow for all expenses',
        isDefault: true,
        isActive: true,
        createdBy: 'system',
        steps: [
          {
            id: 'step1',
            order: 1,
            type: 'user',
            isRequired: true,
            allowParallelApproval: false,
            timeoutDays: 3,
            conditions: { maxAmount: 500 },
            autoApprove: true,
            autoApproveConditions: { maxAmount: 50 },
          },
          {
            id: 'step2',
            order: 2,
            type: 'role',
            roles: ['manager'],
            isRequired: true,
            allowParallelApproval: false,
            timeoutDays: 5,
            conditions: { maxAmount: 5000 },
          },
          {
            id: 'step3',
            order: 3,
            type: 'role',
            roles: ['finance'],
            isRequired: true,
            allowParallelApproval: false,
            timeoutDays: 7,
            conditions: { minAmount: 1000 },
          },
        ],
      };

      this.createWorkflowTemplate(defaultWorkflow);
    }

    this.saveStoredData();
  }
}

// Export singleton instance
export const approvalWorkflowService = new ApprovalWorkflowService();

// Export types and classes
export { ApprovalWorkflowService };
export type {
  User,
  Permission,
  ApprovalStep,
  WorkflowTemplate,
  ExpenseApproval,
  ApprovalStepInstance,
  ApprovalComment,
  ApprovalStats,
  ApprovalNotification,
};