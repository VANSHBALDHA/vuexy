'use client'
import { useEffect, useMemo, useState } from 'react'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import MenuItem from '@mui/material/MenuItem'
import { Checkbox, Divider, IconButton } from '@mui/material'
import { Controller, useForm } from 'react-hook-form'
import { useParams } from 'next/navigation'
import TablePagination from '@mui/material/TablePagination'
import { styled } from '@mui/material/styles'
import classnames from 'classnames'
import { rankItem } from '@tanstack/match-sorter-utils'

import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getFilteredRowModel,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFacetedMinMaxValues,
    getPaginationRowModel,
    getSortedRowModel
} from '@tanstack/react-table'
import type { ColumnDef, FilterFn } from '@tanstack/react-table'
import type { RankingInfo } from '@tanstack/match-sorter-utils'
import type { ThemeColor } from '@core/types'
import TablePaginationComponent from '@components/TablePaginationComponent'
import CustomTextField from '@core/components/mui/TextField'
import type { TextFieldProps } from '@mui/material/TextField'
import { getLocalizedUrl } from '@/utils/i18n'
import tableStyles from '@core/styles/table.module.css'

declare module '@tanstack/table-core' {
    interface FilterFns {
        fuzzy: FilterFn<unknown>
    }
    interface FilterMeta {
        itemRank: RankingInfo
    }
}

interface UserDataTypes {
    _id: string
    name: string
    email: string
    password: string
    user_type: string
}

type UsersTypeWithAction = UserDataTypes & {
    action?: string
}
const Icon = styled('i')({})

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value)
    addMeta({
        itemRank
    })
    return itemRank.passed
}

const DebouncedInput = ({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}: {
    value: string | number
    onChange: (value: string | number) => void
    debounce?: number
} & Omit<TextFieldProps, 'onChange'>) => {
    // States
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
        setValue(initialValue)
    }, [initialValue])

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value)
        }, debounce)

        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value])

    return <CustomTextField {...props} value={value} onChange={e => setValue(e.target.value)} />
}

const columnHelper = createColumnHelper<UsersTypeWithAction>()

const Leads = () => {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [rowSelection, setRowSelection] = useState({})
    const [data, setData] = useState<UserDataTypes[]>([])
    const [filteredData, setFilteredData] = useState<UserDataTypes[]>([])
    const [globalFilter, setGlobalFilter] = useState('')
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
    const {
        control,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm({
        defaultValues: {
            userName: '',
            userEmail: '',
            userPassword: '',
            user_type: ''
        }
    })

    const getUsersData = async () => {
        try {
            const res = await fetch('http://localhost:3001/users-list', { cache: 'no-store' })

            if (!res.ok) {
                throw new Error('Failed to fetch  data')
            }

            const data = await res.json()
            setData(data)
            setFilteredData(data)
        } catch (error) {
            console.error('Error fetching  data:', error)
            throw error
        }
    }

    useEffect(() => {
        getUsersData()
    }, [])

    const handleDrawerToggle = () => {
        if (drawerOpen) {
            reset()
        }
        setDrawerOpen(!drawerOpen)
    }

    const handleReset = () => {
        reset()
        setDrawerOpen(false)
        setSelectedUserId(null)
    }

    // const onSubmit = async (data: any) => {
    //     const { userName, userEmail, userPassword, user_type } = data

    //     if (selectedUserId) {
    //         const resdata = await fetch(`http://localhost:3001/update-user/${selectedUserId}`, {
    //             method: 'PUT',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({ userName, userEmail, userPassword, user_type })
    //         })

    //         if (resdata.ok) {
    //             getUsersData()
    //             reset()
    //             setDrawerOpen(false)
    //             setSelectedUserId(null)
    //         } else {
    //             console.error('Failed to update the customer')
    //         }
    //     } else {
    //         const resdata = await fetch('http://localhost:3001/users', {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json'
    //             },
    //             body: JSON.stringify({ userName, userEmail, userPassword, user_type })
    //         })

    //         if (resdata.ok) {
    //             getUsersData()
    //             reset()
    //             setDrawerOpen(false)
    //         } else {
    //             console.error('Failed to create a new customer')
    //         }
    //     }
    // }

    const onSubmit = async (data: any) => {
        const { userName, userEmail, userPassword, user_type } = data

        // Proceed with API call
        try {
            const resdata = await fetch(selectedUserId
                ? `http://localhost:3001/update-user/${selectedUserId}`
                : 'http://localhost:3001/users',
                {
                    method: selectedUserId ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...data,
                    })
                });

            if (resdata.ok) {
                getUsersData();
                reset();
                setDrawerOpen(false);
                setSelectedUserId(null);
            } else {
                console.error('Failed to submit the form');
            }
        } catch (error) {
            console.error('Error submitting the form:', error);
        }
    };

    const handleDelete = (id: number) => {
        fetch(`http://localhost:3001/delete-user/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (response.ok) {
                    getUsersData()
                } else {
                    console.error('Failed to delete the record')
                }
            })
            .catch(err => {
                console.error('Error deleting the record:', err)
            })
    }

    const handleEdit = (id: number) => {
        const customer = data.find((customers) => customers._id === id)
        if (customer) {
            setValue('userName', customer.name)
            setValue('userEmail', customer.email)
            setValue('userPassword', customer.password)
            setValue('user_type', customer.user_type)
            setSelectedUserId(customer._id)
            setDrawerOpen(true)
        }
    }

    const columns = useMemo<ColumnDef<any, any>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <Checkbox
                        {...{
                            checked: table.getIsAllRowsSelected(),
                            indeterminate: table.getIsSomeRowsSelected(),
                            onChange: table.getToggleAllRowsSelectedHandler()
                        }}
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        {...{
                            checked: row.getIsSelected(),
                            disabled: !row.getCanSelect(),
                            indeterminate: row.getIsSomeSelected(),
                            onChange: row.getToggleSelectedHandler()
                        }}
                    />
                )
            },
            {
                accessorKey: 'name',
                header: 'Name',
                cell: ({ getValue }) => <span>{getValue()}</span>
            },
            {
                accessorKey: 'email',
                header: 'Email',
                cell: ({ getValue }) => <span>{getValue()}</span>
            },
            {
                accessorKey: 'password',
                header: 'Password',
                cell: ({ getValue }) => <span>{getValue()}</span>
            },
            {
                accessorKey: 'user_type',
                header: 'User Type',
                cell: ({ getValue }) => <span>{getValue()}</span>
            },

            columnHelper.accessor('action', {
                header: () => <div className="text-right">Action</div>,
                cell: ({ row }) => {
                    const Ids = row?.original?._id;

                    return (
                        <div className='flex items-center justify-end'>
                            <IconButton onClick={() => handleDelete(Ids)}>
                                <i className='tabler-trash text-textSecondary' />
                            </IconButton>

                            <IconButton onClick={() => handleEdit(Ids)}>
                                <i className='tabler-edit text-textSecondary' />
                            </IconButton>
                        </div>
                    );
                },
                enableSorting: false
            })
        ],
        [data]
    )

    const table = useReactTable({
        data: filteredData,
        columns,
        filterFns: {
            fuzzy: fuzzyFilter
        },
        state: {
            rowSelection,
            globalFilter
        },
        initialState: {
            pagination: {
                pageSize: 10
            }
        },
        enableRowSelection: true,
        globalFilterFn: fuzzyFilter,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        onGlobalFilterChange: setGlobalFilter,
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        getFacetedMinMaxValues: getFacetedMinMaxValues()
    })

    return (
        <Grid container spacing={6}>
            <Grid item xs={12}>
                <Typography variant='h4' className='mbe-1'>
                    Leads
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <div className='flex justify-between flex-col items-start md:flex-row md:items-center p-6 border-bs gap-4'>
                    <CustomTextField
                        select
                        value={table.getState().pagination.pageSize}
                        onChange={e => table.setPageSize(Number(e.target.value))}
                        className='max-sm:is-full sm:is-[70px]'
                    >
                        <MenuItem value='10'>10</MenuItem>
                        <MenuItem value='25'>25</MenuItem>
                        <MenuItem value='50'>50</MenuItem>
                    </CustomTextField>
                    <div className='flex flex-col sm:flex-row max-sm:is-full items-start sm:items-center gap-4'>
                        <DebouncedInput
                            value={globalFilter ?? ''}
                            onChange={value => setGlobalFilter(String(value))}
                            placeholder='Search...'
                            className='max-sm:is-full'
                        />
                        <Button
                            variant='contained'
                            startIcon={<i className='tabler-plus' />}
                            onClick={handleDrawerToggle}
                            className='max-sm:is-full'
                        >
                            Add User
                        </Button>
                    </div>
                </div>
                <div className='overflow-x-auto'>
                    <table className={tableStyles.table}>
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => (
                                        <th key={header.id}>
                                            {header.isPlaceholder ? null : (
                                                <>
                                                    <div
                                                        className={classnames({
                                                            'flex items-center': header.column.getIsSorted(),
                                                            'cursor-pointer select-none': header.column.getCanSort()
                                                        })}
                                                        onClick={header.column.getToggleSortingHandler()}
                                                    >
                                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                                        {{
                                                            asc: <i className='tabler-chevron-up text-xl' />,
                                                            desc: <i className='tabler-chevron-down text-xl' />
                                                        }[header.column.getIsSorted() as 'asc' | 'desc'] ?? null}
                                                    </div>
                                                </>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        {table.getFilteredRowModel().rows.length === 0 ? (
                            <tbody>
                                <tr>
                                    <td colSpan={table.getVisibleFlatColumns().length} className='text-center'>
                                        No data available
                                    </td>
                                </tr>
                            </tbody>
                        ) : (
                            <tbody>
                                {table
                                    .getRowModel()
                                    .rows.slice(0, table.getState().pagination.pageSize)
                                    .map(row => {
                                        return (
                                            <tr key={row.id} className={classnames({ selected: row.getIsSelected() })}>
                                                {row.getVisibleCells().map(cell => (
                                                    <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                                                ))}
                                            </tr>
                                        )
                                    })}
                            </tbody>
                        )}
                    </table>
                </div>
                <TablePagination
                    component={() => <TablePaginationComponent table={table} />}
                    count={table.getFilteredRowModel().rows.length}
                    rowsPerPage={table.getState().pagination.pageSize}
                    page={table.getState().pagination.pageIndex}
                    onPageChange={(_, page) => {
                        table.setPageIndex(page)
                    }}
                />
            </Grid>

            <Drawer
                open={drawerOpen}
                anchor='right'
                variant='temporary'
                ModalProps={{ keepMounted: true }}
                sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
            >
                <div className='flex items-center justify-between plb-5 pli-6'>
                    <Typography variant='h5'>{selectedUserId ? 'Edit User' : 'Add New User'}</Typography>
                    <IconButton size='small' onClick={handleReset}>
                        <i className='tabler-x text-2xl text-textPrimary' />
                    </IconButton>
                </div>
                <Divider />
                <div>
                    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-6 p-6'>
                        <Controller
                            name='userName'
                            control={control}
                            rules={{ required: 'User name is required' }}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    fullWidth
                                    label='User Name'
                                    placeholder='Enter user name'
                                    {...(errors.userName && { error: true, helperText: errors.userName.message })}
                                />
                            )}
                        />
                        <Controller
                            name='userEmail'
                            control={control}
                            rules={{ required: 'Email is required' }}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    fullWidth
                                    label='User Email'
                                    placeholder='Enter email address'
                                    {...(errors.userEmail && { error: true, helperText: errors.userEmail.message })}
                                />
                            )}
                        />
                        <Controller
                            name='userPassword'
                            control={control}
                            rules={{ required: 'Password is required' }}
                            render={({ field }) => (
                                <CustomTextField
                                    {...field}
                                    fullWidth
                                    label='User Password'
                                    placeholder='Enter your password'
                                    {...(errors.userPassword && { error: true, helperText: errors.userPassword.message })}
                                />
                            )}
                        />

                        <Controller
                            name='user_type'
                            control={control}
                            rules={{ required: 'User type is required' }}
                            render={({ field }) => (
                                <CustomTextField
                                    select
                                    fullWidth
                                    id='user-type'
                                    label='Select Type'
                                    {...field}
                                    {...(errors.user_type && { error: true, helperText: errors.user_type.message })}
                                >
                                    <MenuItem value='User'>User</MenuItem>
                                    <MenuItem value='Admin'>Admin</MenuItem>
                                </CustomTextField>
                            )}
                        />

                        <div className='flex items-center gap-4'>
                            <Button variant='contained' type='submit'>
                                {selectedUserId ? 'Update' : 'Submit'}
                            </Button>
                            <Button variant='tonal' color='error' type='reset' onClick={handleReset}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </Drawer>
        </Grid>
    )
}

export default Leads
