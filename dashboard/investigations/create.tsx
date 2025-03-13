// // src/pages/investigations/create.tsx
// import React from 'react';
// import { createInvestigation } from '@/api/investigation';
// import InvestigationForm from '@/components/Investigations/InvestigationForm';

// const CreateInvestigationPage = () => {
//   const handleSubmit = async (values: any) => {
//     await createInvestigation(values);
//     window.location.href = '/investigations';
//   };

//   return (
//     <div className="p-8">
//       <h1 className="text-2xl font-bold mb-4">Create Investigation</h1>
//       <InvestigationForm onSubmit={handleSubmit} />
//     </div>
//   );
// };

// export default CreateInvestigationPage;