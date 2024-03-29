import { useState, useEffect } from "react";
import { Box, Button, Container, FormControl, FormLabel, Heading, Image, Input, Modal, ModalBody, ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalOverlay, Stack, Text, useDisclosure } from "@chakra-ui/react";
import { FaStar, FaUser, FaSignInAlt, FaSignOutAlt, FaUpload } from "react-icons/fa";
// Mock Supabase client
const supabase = {
  auth: {
    session: () => null,
    onAuthStateChange: () => ({ data: { unsubscribe: () => {} } }),
    signIn: () => ({ user: null, error: null }),
    signUp: () => ({ user: null, error: null }),
    signOut: () => Promise.resolve(),
  },
  from: () => ({
    select: () => ({
      order: () => ({
        limit: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    insert: () => Promise.resolve(),
  }),
  storage: {
    from: () => ({
      upload: () => Promise.resolve({ data: { Key: "" }, error: null }),
    }),
  },
};

const Index = () => {
  const [user, setUser] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const { isOpen: isLoginOpen, onOpen: onLoginOpen, onClose: onLoginClose } = useDisclosure();
  const { isOpen: isSignupOpen, onOpen: onSignupOpen, onClose: onSignupClose } = useDisclosure();
  const { isOpen: isUploadOpen, onOpen: onUploadOpen, onClose: onUploadClose } = useDisclosure();

  useEffect(() => {
    fetchRandomPhoto();
    const session = supabase.auth.session();
    setUser(session?.user ?? null);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const fetchRandomPhoto = async () => {
    const { data, error } = await supabase.from("photos").select("*").order("random()").limit(1).single();
    if (error) {
      console.error("Error fetching photo:", error);
    } else {
      setPhoto(data);
      setRating(0);
      setComment("");
    }
  };

  const handleLogin = async (email, password) => {
    const { user, error } = await supabase.auth.signIn({ email, password });
    if (error) {
      alert("Error logging in: " + error.message);
    } else {
      onLoginClose();
    }
  };

  const handleSignup = async (email, password) => {
    const { user, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      alert("Error signing up: " + error.message);
    } else {
      onSignupClose();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleRating = async (value) => {
    setRating(value);
    await supabase.from("ratings").insert({ photo_id: photo.id, rating: value });
  };

  const handleComment = async () => {
    await supabase.from("comments").insert({ photo_id: photo.id, user_id: user.id, comment });
    setComment("");
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    const { data, error } = await supabase.storage.from("photos").upload(file.name, file);
    if (error) {
      console.error("Error uploading photo:", error);
    } else {
      await supabase.from("photos").insert({ url: data.Key });
      onUploadClose();
      fetchRandomPhoto();
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <Stack spacing={8}>
        <Heading as="h1" size="2xl" textAlign="center">
          Photo Rating App
        </Heading>
        {user ? (
          <Box textAlign="right">
            <Text>Welcome, {user.email}</Text>
            <Button leftIcon={<FaSignOutAlt />} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        ) : (
          <Box textAlign="right">
            <Button leftIcon={<FaSignInAlt />} onClick={onLoginOpen} mr={4}>
              Login
            </Button>
            <Button leftIcon={<FaUser />} onClick={onSignupOpen}>
              Sign Up
            </Button>
          </Box>
        )}
        {photo ? (
          <Box>
            <Image src={photo.url} alt="Random photo" objectFit="cover" width="100%" />
            <Box mt={4}>
              {[1, 2, 3, 4, 5].map((value) => (
                <Button key={value} leftIcon={<FaStar />} colorScheme={value <= rating ? "yellow" : "gray"} variant={value <= rating ? "solid" : "outline"} onClick={() => handleRating(value)} mr={2}>
                  {value}
                </Button>
              ))}
            </Box>
            {user && (
              <FormControl mt={4}>
                <FormLabel>Comment</FormLabel>
                <Input value={comment} onChange={(e) => setComment(e.target.value)} />
                <Button mt={2} onClick={handleComment}>
                  Submit Comment
                </Button>
              </FormControl>
            )}
          </Box>
        ) : (
          <Text>Loading photo...</Text>
        )}
        <Box textAlign="center">
          <Button onClick={fetchRandomPhoto}>Next Photo</Button>
        </Box>
        {user && (
          <Box textAlign="center">
            <Button leftIcon={<FaUpload />} onClick={onUploadOpen}>
              Upload Photo
            </Button>
          </Box>
        )}
      </Stack>

      <Modal isOpen={isLoginOpen} onClose={onLoginClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Login</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="email" id="loginEmail" />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Password</FormLabel>
              <Input type="password" id="loginPassword" />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => handleLogin(document.getElementById("loginEmail").value, document.getElementById("loginPassword").value)}>Login</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isSignupOpen} onClose={onSignupClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sign Up</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type="email" id="signupEmail" />
            </FormControl>
            <FormControl mt={4}>
              <FormLabel>Password</FormLabel>
              <Input type="password" id="signupPassword" />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => handleSignup(document.getElementById("signupEmail").value, document.getElementById("signupPassword").value)}>Sign Up</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal isOpen={isUploadOpen} onClose={onUploadClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Photo</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input type="file" onChange={handleUpload} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Index;
