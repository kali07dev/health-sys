// // src/pages/investigations/[id]/edit.tsx
// import React, { useEffect, useState } from 'react';
// import { Investigation } from '../../../../interfaces/investigation';
// import { fetchInvestigationById, updateInvestigation } from '../../../../api/investigation';
// import InvestigationForm from '../../../../components/Investigations/create-investigation-form';


// const EditInvestigationPage = ({ id }: { id: string }) => {
//   const [investigation, setInvestigation] = useState<Investigation | null>(null);

//   useEffect(() => {
//     const fetchData = async () => {
//       const data = await fetchInvestigationById(id);
//       setInvestigation(data);
//     };
//     fetchData();
//   }, [id]);

//   const handleSubmit = async (values: any) => {
//     await updateInvestigation(id, values);
//     window.location.href = '/investigations';
//   };

//   if (!investigation) return <p>Loading...</p>;

//   return (
//     <div className="p-8">
//       <h1 className="text-2xl font-bold mb-4">Edit Investigation</h1>
//       <InvestigationForm initialValues={investigation} onSubmit={handleSubmit} />
//     </div>
//   );
// };

// export default EditInvestigationPage;