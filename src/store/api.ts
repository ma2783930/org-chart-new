/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import { OrgNode, DepartmentGroup } from '../types';

// Helper to deep clone
const cloneDeep = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

// Default Initial Tree Structure - Food & Drug General Directory
const INITIAL_DATA: OrgNode[] = [
  {
    id: 1,
    name: "اداره کل غذا و دارو",
    department_number: "1000",
    role: "ریاست اداره کل",
    type: "general_office",
    managerName: "دکتر امیر علیزاده",
    employeeCount: 150,
    department_group: null,
    children: [
      {
        id: 2,
        name: "معاونت توسعه مدیریت و منابع",
        department_number: "1100",
        role: "معاون توسعه",
        type: "office",
        managerName: "مهندس سهراب رضایی",
        employeeCount: 45,
        department_group: null,
        children: [
          {
            id: 3,
            name: "اداره امور مالی",
            department_number: "1110",
            role: "رئیس اداره امور مالی",
            type: "department",
            managerName: "سارا احمدی",
            employeeCount: 12,
            department_group: { id: "g1", name: "گروه امور پشتیبانی و اداری" }
          },
          {
            id: 4,
            name: "اداره تشکیلات و بودجه",
            department_number: "1120",
            role: "رئیس اداره بودجه",
            type: "department",
            managerName: "حمید محسنی",
            employeeCount: 8,
            department_group: { id: "g1", name: "گروه امور پشتیبانی و اداری" }
          },
          {
            id: 5,
            name: "دایره تدارکات و خدمات فنی",
            department_number: "1130",
            role: "مسئول تدارکات",
            type: "staff",
            managerName: "علی ناصری",
            employeeCount: 15,
            department_group: { id: "g2", name: "گروه تدارکات و کارهای فنی" }
          },
          {
            id: 6,
            name: "واحد خدمات عمومی و رفاهی",
            department_number: "1140",
            role: "سرپرست خدمات",
            type: "staff",
            managerName: "مریم حسینی",
            employeeCount: 10,
            department_group: { id: "g2", name: "گروه تدارکات و کارهای فنی" }
          }
        ]
      },
      {
        id: 7,
        name: "معاونت نظارت بر غذا و آشامیدنی",
        department_number: "1200",
        role: "معاون نظارت بر مواد غذایی",
        type: "office",
        managerName: "دکتر مینا سعادت",
        employeeCount: 60,
        department_group: null,
        children: [
          {
            id: 8,
            name: "اداره نظارت بر محصولات غله‌ای و سنتی",
            department_number: "1210",
            role: "رئیس اداره غلات",
            type: "department",
            managerName: "مهندس بهنام رحیمی",
            employeeCount: 18,
            department_group: null
          },
          {
            id: 9,
            name: "اداره ممیزی استانداردها و پروانه‌ها",
            department_number: "1220",
            role: "مسئول استانداردسازی",
            type: "department",
            managerName: "اکبر کریمی",
            employeeCount: 14,
            department_group: { id: "g3", name: "گروه استانداردهای اعتبارسنجی" }
          },
          {
            id: 10,
            name: "آزمایشگاه کنترل مرجع صنایع غذایی",
            department_number: "1230",
            role: "مدیر فنی آزمایشگاه",
            type: "committee",
            managerName: "دکتر نیلوفر عباسی",
            employeeCount: 28,
            department_group: { id: "g3", name: "گروه استانداردهای اعتبارسنجی" }
          }
        ]
      },
      {
        id: 11,
        name: "معاونت دارو و مواد تحت کنترل",
        department_number: "1300",
        role: "معاون دارویی",
        type: "office",
        managerName: "دکتر شایان یوسفی",
        employeeCount: 40,
        department_group: null,
        children: [
          {
            id: 12,
            name: "اداره ثبت و صدور پروانه دارویی",
            department_number: "1310",
            role: "رئیس اداره ثبت دارو",
            type: "department",
            managerName: "دکتر پویا طباطبایی",
            employeeCount: 15,
            department_group: { id: "g4", name: "گروه رگولاتوری و صدور مجوزها" }
          },
          {
            id: 13,
            name: "اداره بازرسی و زنجیره توزیع دارو",
            department_number: "1320",
            role: "رئیس اداره زنجیره توزیع",
            type: "department",
            managerName: "دکتر زهرا رفیعی",
            employeeCount: 15,
            department_group: { id: "g4", name: "گروه رگولاتوری و صدور مجوزها" }
          },
          {
            id: 14,
            name: "دفتر هماهنگی و سیاست‌گذاری مواد مخدر",
            department_number: "1330",
            role: "دبیر هماهنگی",
            type: "committee",
            managerName: "مهندس کاوه فرهادی",
            employeeCount: 8,
            department_group: null
          }
        ]
      }
    ]
  }
];

// LocalStorage helpers to simulate database state
const STORAGE_KEY = 'org_chart_data';

const getStoredData = (): OrgNode[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read index structure', e);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
  return INITIAL_DATA;
};

const saveStoredData = (data: OrgNode[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Tree modification helpers
const findNodeAndPerform = (
  nodes: OrgNode[],
  targetId: number | string,
  action: (node: OrgNode, parent?: OrgNode, index?: number, list?: OrgNode[]) => boolean
): boolean => {
  const traverse = (currentNodes: OrgNode[], parent?: OrgNode): boolean => {
    for (let i = 0; i < currentNodes.length; i++) {
      const node = currentNodes[i];
      if (node.id === targetId || String(node.id) === String(targetId)) {
        if (action(node, parent, i, currentNodes)) {
          return true;
        }
      }
      if (node.children && node.children.length > 0) {
        if (traverse(node.children, node)) {
          return true;
        }
      }
    }
    return false;
  };
  return traverse(nodes);
};

export const orgChartApi = createApi({
  reducerPath: 'orgChartApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['OrgChart'],
  refetchOnFocus: false,
  refetchOnReconnect: false,
  endpoints: (builder) => ({
    // Fetch the entire tree
    getOrgChart: builder.query<OrgNode[], void>({
      queryFn: async () => {
        try {
          const data = getStoredData();
          return { data };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message || 'خطا در بارگذاری داده‌ها' } };
        }
      },
      providesTags: ['OrgChart'],
    }),

    // Update styling/contents of an existing Node
    updateNode: builder.mutation<OrgNode[], OrgNode>({
      queryFn: async (updatedNode) => {
        try {
          const tree = cloneDeep(getStoredData());
          const success = findNodeAndPerform(tree, updatedNode.id, (node) => {
            node.name = updatedNode.name;
            node.department_number = updatedNode.department_number;
            node.role = updatedNode.role;
            node.type = updatedNode.type;
            node.managerName = updatedNode.managerName;
            node.managerAvatar = updatedNode.managerAvatar;
            node.employeeCount = updatedNode.employeeCount;
            node.department_group = updatedNode.department_group;
            return true;
          });

          if (!success) {
            throw new Error(`نود با شناسه ${updatedNode.id} یافت نشد.`);
          }

          saveStoredData(tree);
          return { data: tree };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['OrgChart'],
    }),

    // Add a new child to a specific parent node
    addNode: builder.mutation<OrgNode[], { parentId: number | string; node: Omit<OrgNode, 'id'> }>({
      queryFn: async ({ parentId, node }) => {
        try {
          const tree = cloneDeep(getStoredData());
          const newId = Date.now(); // Simple auto ID
          const newNode: OrgNode = {
            ...node,
            id: newId,
            children: []
          };

          const success = findNodeAndPerform(tree, parentId, (parentNode) => {
            if (!parentNode.children) {
              parentNode.children = [];
            }
            parentNode.children.push(newNode);
            return true;
          });

          if (!success) {
            throw new Error(`یافت نشد. parent ID: ${parentId}`);
          }

          saveStoredData(tree);
          return { data: tree };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['OrgChart'],
    }),

    // Delete a Node
    deleteNode: builder.mutation<OrgNode[], number | string>({
      queryFn: async (nodeId) => {
        try {
          const tree = cloneDeep(getStoredData());
          
          if (nodeId === 1 || String(nodeId) === '1') {
            throw new Error("امکان حذف کردن ریشه (نود اصلی) وجود ندارد.");
          }

          const success = findNodeAndPerform(tree, nodeId, (_node, parent, idx, list) => {
            if (parent && list && typeof idx === 'number') {
              // Re-attach orphaned children of the deleted node to its parent (preserving children hierarchy)
              if (_node.children && _node.children.length > 0) {
                parent.children = parent.children?.filter(n => n.id !== nodeId) || [];
                parent.children.push(..._node.children);
              } else {
                list.splice(idx, 1);
              }
              return true;
            }
            return false;
          });

          if (!success) {
            throw new Error(`شکست در حذف نود ${nodeId}`);
          }

          saveStoredData(tree);
          return { data: tree };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['OrgChart'],
    }),

    // Batch set nodes / completely override tree
    saveWholeTree: builder.mutation<OrgNode[], OrgNode[]>({
      queryFn: async (newTree) => {
        try {
          saveStoredData(newTree);
          return { data: newTree };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['OrgChart'],
    }),

    // Reset dataset to initial template
    resetChart: builder.mutation<OrgNode[], void>({
      queryFn: async () => {
        try {
          saveStoredData(INITIAL_DATA);
          return { data: INITIAL_DATA };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message || 'خطا در بارگذاری داده‌ها' } };
        }
      },
      invalidatesTags: ['OrgChart'],
    }),

    // Move a Node (Reparenting drag & drop)
    moveNode: builder.mutation<OrgNode[], { nodeId: number | string; targetParentId: number | string }>({
      queryFn: async ({ nodeId, targetParentId }) => {
        try {
          const tree = cloneDeep(getStoredData());

          if (nodeId === targetParentId || String(nodeId) === String(targetParentId)) {
            throw new Error("یک واحد فنی را نمی‌توان به خودش منتقل کرد.");
          }

          if (nodeId === 1 || String(nodeId) === '1') {
            throw new Error("ریاست کل (نود اصلی چارت) را نمی‌توان جابجا کرد.");
          }

          // Check if targetParentId is a child/descendant of nodeId (prevent endless recursion loops)
          let isLoop = false;
          findNodeAndPerform(tree, nodeId, (draggedNode) => {
            const checkDescendant = (n: OrgNode): boolean => {
              if (n.id === targetParentId || String(n.id) === String(targetParentId)) {
                return true;
              }
              if (n.children && n.children.length > 0) {
                return n.children.some(checkDescendant);
              }
              return false;
            };
            isLoop = checkDescendant(draggedNode);
            return true;
          });

          if (isLoop) {
            throw new Error("امکان انتقال یک واحد به عنوان زیرمجموعهِ فرزندهای خودش وجود ندارد.");
          }

          // Find the parent ID before we move it (for debugging/callback purposes if needed)
          let draggedNodeEntity: OrgNode | null = null;
          const removed = findNodeAndPerform(tree, nodeId, (node, parent, idx, list) => {
            draggedNodeEntity = { ...node }; // Clone node
            if (list && typeof idx === 'number') {
              list.splice(idx, 1); // delete from current list
              return true;
            }
            return false;
          });

          if (!removed || !draggedNodeEntity) {
            throw new Error(`شکست در جابجایی: واحد هدف به شناه ${nodeId} یافت نشد.`);
          }

          // Insert under parent
          const inserted = findNodeAndPerform(tree, targetParentId, (parentNode) => {
            if (!parentNode.children) {
              parentNode.children = [];
            }
            parentNode.children.push(draggedNodeEntity!);
            return true;
          });

          if (!inserted) {
            throw new Error(`شکست در جابجایی: واحد مقصد به شناسه ${targetParentId} یافت نشد.`);
          }

          saveStoredData(tree);
          return { data: tree };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['OrgChart'],
    }),

    // Merge two nodes
    mergeNodes: builder.mutation<OrgNode[], { sourceNodeId: number | string; targetNodeId: number | string; newName: string }>({
      queryFn: async ({ sourceNodeId, targetNodeId, newName }) => {
        try {
          const tree = cloneDeep(getStoredData());

          if (sourceNodeId === targetNodeId || String(sourceNodeId) === String(targetNodeId)) {
            throw new Error("یک واحد فنی را نمی‌توان با خودش ادغام کرد.");
          }

          if (sourceNodeId === 1 || String(sourceNodeId) === '1') {
            throw new Error("ریاست کل را نمی‌توان با ساختار دیگر ادغام فیزیکی کرد.");
          }

          // Check for recursive loops before making changes
          let isLoop = false;
          findNodeAndPerform(tree, sourceNodeId, (sourceNode) => {
            const checkDescendant = (n: OrgNode): boolean => {
              if (n.id === targetNodeId || String(n.id) === String(targetNodeId)) {
                return true;
              }
              if (n.children && n.children.length > 0) {
                return n.children.some(checkDescendant);
              }
              return false;
            };
            isLoop = checkDescendant(sourceNode);
            return true;
          });

          if (isLoop) {
            throw new Error("امکان ادغام یک واحد با فرزند خودش وجود ندارد.");
          }

          // Read source node entity
          let sourceNodeEntity: OrgNode | null = null;
          const removed = findNodeAndPerform(tree, sourceNodeId, (node, parent, idx, list) => {
            sourceNodeEntity = cloneDeep(node);
            if (list && typeof idx === 'number') {
              list.splice(idx, 1);
              return true;
            }
            return false;
          });

          if (!removed || !sourceNodeEntity) {
            throw new Error(`شکست در ادغام: واحد مبدأ یافت نشد.`);
          }

          // Merge source into target
          const merged = findNodeAndPerform(tree, targetNodeId, (targetNode) => {
            // Update name
            targetNode.name = newName;
            
            // Combine employee count
            targetNode.employeeCount = (targetNode.employeeCount || 0) + (sourceNodeEntity!.employeeCount || 0);
            
            // Combine children
            const targetChildren = targetNode.children || [];
            const sourceChildren = sourceNodeEntity!.children || [];
            targetNode.children = [...targetChildren, ...sourceChildren];
            
            return true;
          });

          if (!merged) {
            throw new Error(`شکست در ادغام: واحد مقصد یافت نشد.`);
          }

          saveStoredData(tree);
          return { data: tree };
        } catch (error: any) {
          return { error: { status: 'CUSTOM_ERROR', error: error.message } };
        }
      },
      invalidatesTags: ['OrgChart'],
    })
  })
});

export const {
  useGetOrgChartQuery,
  useUpdateNodeMutation,
  useAddNodeMutation,
  useDeleteNodeMutation,
  useSaveWholeTreeMutation,
  useResetChartMutation,
  useMoveNodeMutation,
  useMergeNodesMutation,
} = orgChartApi;
