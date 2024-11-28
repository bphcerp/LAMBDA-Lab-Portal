import React, { useEffect, useState } from 'react';
import { toastError, toastSuccess } from '../toasts';
import { MdOutlineDescription } from "react-icons/md";

import { Link } from 'react-router-dom';
import DescriptionModal from '../components/DescriptionModal';
import { createColumnHelper } from '@tanstack/react-table';
import TableCustom from '../components/TableCustom';
import { Reimbursement } from '../types';
import { RiDeleteBin6Line, RiEdit2Line } from 'react-icons/ri';
import DeleteConfirmationModal from '../components/DeleteConfirmationModal';
import { Button } from 'flowbite-react';
import AddReferenceModal from '../components/AddReferenceModal';
import PDFLink from '../components/PDFLink';
import EditReimbursementModal from '../components/EditReimbursementModal';

const ReimbursementPage: React.FC = () => {
    const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReimbursements, setSelectedReimbursements] = useState<Set<string>>(new Set());
    const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false)
    const [description, setDescription] = useState("")
    const [isDescModalOpen, setIsDescModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [reimbursementToDelete, setReimbursementToDelete] = useState<Reimbursement>();
    const [reimbursementIdToAddRefTo, setReimbursementIdToAddRefTo] = useState<string>()
    const [reimbursementToEdit, setReimbursementToEdit] = useState<Reimbursement>()
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)


    const columnHelper = createColumnHelper<Reimbursement>();

    const columns = [
        columnHelper.accessor('createdAt', {
            header: 'Filed On',
            cell: info => new Date(info.getValue()).toLocaleDateString('en-IN'),
            enableColumnFilter: false
        }),
        columnHelper.accessor('title', {
            header: 'Title',
        }),
        columnHelper.accessor('project.project_name', {
            header: 'Project Name',
            cell: info => <Link className='hover:underline text-blue-600'
                to={`/project/${info.row.original.project._id}`}
                target="_blank"
                rel="noopener noreferrer">
                {info.row.original.project.project_name}-{info.row.original.project.project_title}
            </Link>
        }),
        columnHelper.accessor('projectHead', {
            header: 'Project Head',
            meta: {
                filterType: "dropdown"
            }
        }),
        columnHelper.accessor(row => row.paidStatus ? "Paid" : "Unpaid", {
            header: 'Category',
            cell: info => {
                const paidStatus = info.row.original.paidStatus;
                return <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${paidStatus ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        } shadow-sm`}
                >
                    {info.getValue()}
                </span>
            },
            meta: {
                filterType: "dropdown"
            },
        }),
        columnHelper.accessor('totalAmount', {
            header: 'Amount',
            cell: info => info.getValue().toLocaleString('en-IN', { style: 'currency', currency: 'INR' }),
            enableColumnFilter: false
        }),
        columnHelper.accessor('description', {
            header: "Description",
            cell: ({ row }) => <div className='flex justify-center'>
                {row.original.description ? (
                    <MdOutlineDescription
                        size="1.75em"
                        onClick={() => {
                            setDescription(row.original.description);
                            setIsDescModalOpen(true);
                        }}
                        className="hover:text-gray-700 cursor-pointer"
                    />
                ) : "NA"}
            </div>,
            enableColumnFilter: false,
            enableSorting: false
        }),
        columnHelper.accessor("reference_id", {
            header: "Reference",
            cell: ({ row }) =>
                row.original.reference_id ? (
                    <PDFLink url={`${import.meta.env.VITE_BACKEND_URL}/reimburse/${row.original._id}/reference`}>View</PDFLink>
                ) : (
                    <Button size="xs" color="red" onClick={() => {
                        setReimbursementIdToAddRefTo(row.original._id)
                        setIsReferenceModalOpen(true)
                    }}>Add Reference</Button>
                ),
            enableColumnFilter: false,
            enableSorting: false,
        }),
        columnHelper.accessor(() => "Actions", {
            header: "Actions",
            cell: ({ row }) => (
                <div className="flex justify-center">
                    {row.original.paidStatus ? "NA" : <div className='flex divide-x-2'>
                        <button
                            className="w-10 flex justify-center hover:cursor-pointer"
                            onClick={() => openEditModal(row.original)}
                        >
                            <RiEdit2Line color="blue" />
                        </button>
                        <button
                            className="w-10 flex justify-center hover:cursor-pointer"
                            onClick={() => openDeleteModal(row.original)}
                        >
                            <RiDeleteBin6Line color="red" />
                        </button></div>}
                </div>
            ),
            enableColumnFilter: false,
            enableSorting: false
        })
    ];

    const handleDeleteReimbursement = async () => {
        if (!reimbursementToDelete) return;
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse/${reimbursementToDelete._id}`, {
                credentials: "include",
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete reimbursement');
            }

            fetchReimbursements()
            toastSuccess('Reimbursement deleted successfully');
        } catch (error) {
            toastError('Error deleting reimbursement');
            console.error('Error deleting reimbursement:', error);
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const openDeleteModal = (reimbursement: Reimbursement) => {
        setReimbursementToDelete(reimbursement);
        setIsDeleteModalOpen(true);
    };

    const handleEditReimbursement = async (formData : any) => {
        if (!reimbursementToEdit) return;
        try {

            const { expenseIds, selectedProject, selectedProjectHead, totalAmount, reimbursementTitle, description, referenceDocument } = formData;
            
            const data = new FormData();
            data.append('expenses', JSON.stringify(expenseIds));
            data.append('project', selectedProject);
            data.append('projectHead', selectedProjectHead);
            data.append('totalAmount', totalAmount.toString());
            data.append('title', reimbursementTitle);
            data.append('description', description);

            if (referenceDocument) {
                data.append('referenceDocument', referenceDocument);
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse/${reimbursementToEdit._id}`, {
                credentials: "include",
                method: 'PUT',
                body : data
            });

            if (!response.ok) {
                throw new Error((await response.json()).message ?? 'Failed to edit reimbursement');
            }

            fetchReimbursements()
            toastSuccess('Reimbursement edited successfully');
        } catch (error) {
            toastError('Error editing reimbursement');
            console.error('Error editing reimbursement:', error);
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    const openEditModal = (reimbursement: Reimbursement) => {
        setReimbursementToEdit(reimbursement);
        setIsEditModalOpen(true);
    };

    const fetchReimbursements = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse`, {
                credentials: "include",
            });
            if (!response.ok) {
                throw new Error('Failed to fetch reimbursements');
            }
            const data = await response.json();
            setReimbursements(data);
        } catch (error) {
            toastError('Error fetching reimbursements');
            console.error('Error fetching reimbursements:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReimbursements();
    }, []);

    const handleReferenceSubmit = async (file: File) => {

        const formData = new FormData()
        formData.append("referenceDocument", file)
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse/${reimbursementIdToAddRefTo}/reference`, {
                method: 'POST',
                credentials: "include",
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload reference');
            }

            toastSuccess('Added the reference!');
            fetchReimbursements();
        } catch (error) {
            toastError('Error uploading reference');
            console.error('Error uploading reference', error);
        }
        finally {
            setReimbursementIdToAddRefTo(undefined)
            setIsReferenceModalOpen(false)
        }
    }

    const handleMarkAsPaid = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/reimburse/paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include",
                body: JSON.stringify({ reimbursementIds: Array.from(selectedReimbursements) }),
            });

            if (!response.ok) {
                throw new Error('Failed to mark reimbursements as paid');
            }

            toastSuccess('Selected reimbursements marked as paid.');
            fetchReimbursements();
            setSelectedReimbursements(new Set());
        } catch (error) {
            toastError('Error marking reimbursements as paid');
            console.error('Error marking reimbursements as paid:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="flex flex-col w-full p-4">
            <DescriptionModal
                isOpen={isDescModalOpen}
                onClose={() => setIsDescModalOpen(false)}
                type='reimbursement'
                description={description}
            />
            <DeleteConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onDelete={handleDeleteReimbursement}
                item={reimbursementToDelete?.title ?? ""}
            />
            <AddReferenceModal
                isOpen={isReferenceModalOpen}
                onClose={() => setIsReferenceModalOpen(false)}
                onSubmit={handleReferenceSubmit}
            />
             <EditReimbursementModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setReimbursementToEdit(undefined);
                }}
                reimbursement={reimbursementToEdit!}
                onEditReimbursement={handleEditReimbursement}
            />
            <h1 className="text-2xl font-bold mb-4">List of Reimbursements</h1>

            <div className="mb-4">
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
                    onClick={handleMarkAsPaid}
                    disabled={selectedReimbursements.size === 0}
                >
                    Mark as Paid
                </button>
            </div>

            <div className='py-2'>
                <TableCustom data={reimbursements} columns={columns} setSelected={(selectedReimbursements: Array<Reimbursement>) => {
                    setSelectedReimbursements(new Set(selectedReimbursements.map(reimbursement => reimbursement._id)))
                }} initialState={{
                    sorting: [
                        {
                            id: 'createdAt',
                            desc: true
                        }
                    ]
                }} />
            </div>
        </div>
    );
};

export default ReimbursementPage;